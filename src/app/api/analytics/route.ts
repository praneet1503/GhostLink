import { NextRequest, NextResponse } from "next/server";

import { getGhostLink, listGhostLinksByOwner } from "@/lib/kv";
import { getGhostLinkUserIdFromHeaders } from "@/lib/ownership";
import type { AnalyticsResponse, GhostLink } from "@/types";

function incrementCount(counter: Record<string, number>, key: string): void {
  counter[key] = (counter[key] ?? 0) + 1;
}

function resolveBaseUrl(request: NextRequest): string {
  const headerHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const headerProto = request.headers.get("x-forwarded-proto");
  const vercelHost = process.env.VERCEL_URL?.trim();
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (headerHost) {
    const protocol = headerProto ?? (headerHost.includes("localhost") ? "http" : "https");
    return `${protocol}://${headerHost}`.replace(/\/+$/, "");
  }

  if (vercelHost) {
    return `https://${vercelHost}`.replace(/\/+$/, "");
  }

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

function buildAnalytics(links: GhostLink[], baseUrl: string) {
  const tones: Record<string, number> = {};
  const referrers: Record<string, number> = {};
  const devices: Record<string, number> = {};
  const recentSignals = links
    .flatMap((link) => link.signals)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);

  let visits = 0;
  let highestPerformingLink = null as AnalyticsResponse["highestPerformingLink"];

  links.forEach((link) => {
    visits += link.visits;

    if (!highestPerformingLink || link.visits > highestPerformingLink.visits) {
      highestPerformingLink = {
        id: link.id,
        url: `${baseUrl}/g/${link.id}`,
        title: link.originalContent.title,
        visits: link.visits,
      };
    }

    link.signals.forEach((log) => {
      incrementCount(tones, log.toneServed);
      incrementCount(referrers, log.signals.referrer);
      incrementCount(devices, log.signals.deviceType);
    });
  });

  return {
    visits,
    tones,
    referrers,
    devices,
    highestPerformingLink,
    recentSignals,
  };
}

function parseSlugFilter(rawValue: string | null): Set<string> | null {
  if (!rawValue) {
    return null;
  }

  const slugs = rawValue
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);

  return new Set(slugs);
}

export async function GET(request: NextRequest) {
  const userId = getGhostLinkUserIdFromHeaders(request.headers);
  if (!userId) {
    return NextResponse.json(
      { error: "Missing or invalid user identity." },
      { status: 401 },
    );
  }

  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  const slugFilter = parseSlugFilter(request.nextUrl.searchParams.get("slugs"));

  const links = slug
    ? [await getGhostLink(slug)].filter((link): link is NonNullable<typeof link> => {
        if (!link) {
          return false;
        }

        if (link.createdBy !== userId) {
          return false;
        }

        return slugFilter ? slugFilter.has(link.id.toLowerCase()) : true;
      })
    : (await listGhostLinksByOwner(userId, 5000)).filter((link) => {
        return slugFilter ? slugFilter.has(link.id.toLowerCase()) : true;
      });

  if (slug && links.length === 0) {
    return NextResponse.json({ error: "GhostLink not found." }, { status: 404 });
  }

  const analytics = buildAnalytics(links, resolveBaseUrl(request));

  return NextResponse.json({
    slug: slug ?? "all-links",
    visits: analytics.visits,
    tones: analytics.tones,
    referrers: analytics.referrers,
    devices: analytics.devices,
    highestPerformingLink: analytics.highestPerformingLink,
    recentSignals: analytics.recentSignals,
  } satisfies AnalyticsResponse);
}
