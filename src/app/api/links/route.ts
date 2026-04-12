import { NextRequest, NextResponse } from "next/server";

import { deleteGhostLink, getGhostLink, listGhostLinksByOwner } from "@/lib/kv";
import { getGhostLinkUserIdFromHeaders } from "@/lib/ownership";
import type { LinkSummary, LinksResponse } from "@/types";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function resolveBaseUrl(request: NextRequest): string {
  const headerHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
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

function parseLimit(rawValue: string | null): number {
  if (!rawValue) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(parsed)));
}

export async function GET(request: NextRequest) {
  const userId = getGhostLinkUserIdFromHeaders(request.headers);
  if (!userId) {
    return NextResponse.json(
      { error: "Missing or invalid user identity." },
      { status: 401 },
    );
  }

  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const baseUrl = resolveBaseUrl(request);

  const links = await listGhostLinksByOwner(userId, limit);

  const summaries: LinkSummary[] = links.map((link) => {
    return {
      id: link.id,
      url: `${baseUrl}/g/${link.id}`,
      title: link.originalContent.title,
      createdAt: link.createdAt,
      visits: link.visits,
      recentSignals: link.signals.slice(0, 5),
    };
  });

  return NextResponse.json({
    links: summaries,
  } satisfies LinksResponse);
}

export async function DELETE(request: NextRequest) {
  const userId = getGhostLinkUserIdFromHeaders(request.headers);
  if (!userId) {
    return NextResponse.json(
      { error: "Missing or invalid user identity." },
      { status: 401 },
    );
  }

  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug query parameter." }, { status: 400 });
  }

  try {
    const link = await getGhostLink(slug);
    if (!link) {
      return NextResponse.json({ error: "GhostLink not found." }, { status: 404 });
    }

    if (link.createdBy !== userId) {
      return NextResponse.json(
        { error: "You can only delete links created in this browser." },
        { status: 403 },
      );
    }

    const deleted = await deleteGhostLink(slug);
    if (!deleted) {
      return NextResponse.json({ error: "GhostLink not found." }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json(
      { error: "Failed to delete link. Please try again." },
      { status: 500 },
    );
  }
}
