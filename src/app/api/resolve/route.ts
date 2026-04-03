import { NextRequest, NextResponse } from "next/server";

import { getGhostLink, recordVisit } from "@/lib/kv";
import {
  buildFallbackOriginalContent,
  buildHeuristicContent,
  inferPersonality,
} from "@/lib/personalization";
import {
  OpenRouterTimeoutError,
  hasOpenRouterApiKey,
  personalizeWithOpenRouter,
} from "@/lib/openrouter";
import type { BrowserSignals, ResolveResponse } from "@/types";

type ResolvePayloadInput = {
  slug?: unknown;
  signals?: unknown;
};

const allowedDeviceTypes = ["mobile", "tablet", "desktop"] as const;
const allowedScreenSizes = ["small", "medium", "large"] as const;
const allowedTimes = ["morning", "afternoon", "evening", "night"] as const;
const allowedDays = ["weekday", "weekend"] as const;
const allowedReferrers = [
  "linkedin",
  "whatsapp",
  "twitter",
  "github",
  "direct",
  "other",
] as const;
const allowedColorSchemes = ["dark", "light"] as const;
const allowedSpeeds = ["slow", "fast", "unknown"] as const;
const allowedMouseSpeeds = ["slow", "fast", "not_available"] as const;
const allowedPlatforms = [
  "windows",
  "mac",
  "linux",
  "ios",
  "android",
  "other",
] as const;

function toStringValue(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized || fallback;
}

function toEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim() as T;
  return allowed.includes(normalized) ? normalized : fallback;
}

function parseSignals(input: unknown): BrowserSignals | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const raw = input as Record<string, unknown>;

  return {
    timezone: toStringValue(raw.timezone, "UTC"),
    language: toStringValue(raw.language, "en-US"),
    deviceType: toEnum(raw.deviceType, allowedDeviceTypes, "desktop"),
    screenSize: toEnum(raw.screenSize, allowedScreenSizes, "medium"),
    timeOfDay: toEnum(raw.timeOfDay, allowedTimes, "afternoon"),
    dayOfWeek: toEnum(raw.dayOfWeek, allowedDays, "weekday"),
    referrer: toEnum(raw.referrer, allowedReferrers, "other"),
    colorScheme: toEnum(raw.colorScheme, allowedColorSchemes, "light"),
    connectionSpeed: toEnum(raw.connectionSpeed, allowedSpeeds, "unknown"),
    mouseSpeed: toEnum(raw.mouseSpeed, allowedMouseSpeeds, "not_available"),
    platform: toEnum(raw.platform, allowedPlatforms, "other"),
  };
}

export async function POST(request: NextRequest) {
  let payload: ResolvePayloadInput;

  try {
    payload = (await request.json()) as ResolvePayloadInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const slug = toStringValue(payload.slug, "");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug." }, { status: 400 });
  }

  const signals = parseSignals(payload.signals);
  if (!signals) {
    return NextResponse.json({ error: "Missing or invalid signals." }, { status: 400 });
  }

  const link = await getGhostLink(slug);
  if (!link) {
    return NextResponse.json({ error: "GhostLink not found." }, { status: 404 });
  }

  let content = buildHeuristicContent(link.originalContent, signals);
  let personality = inferPersonality(signals);
  let source: ResolveResponse["source"] = "heuristic";

  if (hasOpenRouterApiKey()) {
    try {
      const aiResult = await personalizeWithOpenRouter(link.originalContent, signals);
      content = aiResult.content;
      personality = aiResult.aiPersonality;
      source = "ai";
    } catch (error) {
      console.error("OpenRouter personalization failed", error);
      content = buildFallbackOriginalContent(link.originalContent, signals);
      source = "fallback";

      if (error instanceof OpenRouterTimeoutError) {
        personality = `${personality} (timeout fallback)`;
      }
    }
  }

  await recordVisit(slug, signals, personality, content.tone);

  return NextResponse.json({
    content,
    source,
  } satisfies ResolveResponse);
}
