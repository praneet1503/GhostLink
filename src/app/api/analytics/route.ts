import { NextRequest, NextResponse } from "next/server";

import { getGhostLink } from "@/lib/kv";
import type { AnalyticsResponse } from "@/types";

function incrementCount(counter: Record<string, number>, key: string): void {
  counter[key] = (counter[key] ?? 0) + 1;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug query parameter." }, { status: 400 });
  }

  const link = await getGhostLink(slug);
  if (!link) {
    return NextResponse.json({ error: "GhostLink not found." }, { status: 404 });
  }

  const tones: Record<string, number> = {};
  const referrers: Record<string, number> = {};
  const devices: Record<string, number> = {};

  link.signals.forEach((log) => {
    incrementCount(tones, log.toneServed);
    incrementCount(referrers, log.signals.referrer);
    incrementCount(devices, log.signals.deviceType);
  });

  return NextResponse.json({
    slug: link.id,
    visits: link.visits,
    tones,
    referrers,
    devices,
    recentSignals: link.signals.slice(0, 20),
  } satisfies AnalyticsResponse);
}
