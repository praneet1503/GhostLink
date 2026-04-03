import { NextRequest, NextResponse } from "next/server";

import { getGhostLink, recordVisit } from "@/lib/kv";
import type {
  BrowserSignals,
  PersonalizedContent,
  ReferrerType,
  ResolveResponse,
  Tone,
} from "@/types";

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

function inferTone(signals: BrowserSignals): Tone {
  if (signals.referrer === "linkedin" || signals.referrer === "github") {
    return "professional";
  }

  if (signals.timeOfDay === "night" && signals.referrer === "whatsapp") {
    return "playful";
  }

  if (signals.connectionSpeed === "slow") {
    return "urgent";
  }

  return "casual";
}

function inferPersonality(signals: BrowserSignals): string {
  if (signals.referrer === "linkedin") {
    return "Career-focused explorer";
  }

  if (signals.referrer === "github") {
    return "Technical deep-diver";
  }

  if (signals.referrer === "whatsapp" && signals.timeOfDay === "night") {
    return "Night owl friend";
  }

  if (signals.deviceType === "mobile") {
    return "On-the-go visitor";
  }

  return "Curious browser";
}

function getHeadlinePrefix(referrer: ReferrerType, tone: Tone): string {
  if (referrer === "linkedin") {
    return "A quick professional snapshot:";
  }

  if (referrer === "github") {
    return "Technical context first:";
  }

  if (referrer === "whatsapp") {
    return tone === "playful"
      ? "You made it, here is the fun version:"
      : "You made it, here is the quick version:";
  }

  return tone === "urgent"
    ? "Fast version for your connection:"
    : "Welcome, here is the tailored version:";
}

function buildHeuristicContent(
  title: string,
  body: string,
  cta: string | undefined,
  ctaUrl: string | undefined,
  signals: BrowserSignals,
): PersonalizedContent {
  const tone = inferTone(signals);
  const prefix = getHeadlinePrefix(signals.referrer, tone);

  return {
    title,
    headline: `${prefix} ${title}`,
    body,
    cta: cta ?? "Explore more",
    ctaUrl,
    tone,
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

  const content = buildHeuristicContent(
    link.originalContent.title,
    link.originalContent.body,
    link.originalContent.cta,
    link.originalContent.ctaUrl,
    signals,
  );

  const personality = inferPersonality(signals);
  await recordVisit(slug, signals, personality, content.tone);

  const response: ResolveResponse = {
    content,
    source: "heuristic",
  };

  return NextResponse.json(response);
}
