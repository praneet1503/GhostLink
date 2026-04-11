import type { BrowserSignals } from "@/types";

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
const allowedPlatforms = ["windows", "mac", "linux", "ios", "android", "other"] as const;

const DEFAULT_SIGNALS: BrowserSignals = {
  timezone: "UTC",
  language: "en-US",
  deviceType: "desktop",
  screenSize: "medium",
  timeOfDay: "afternoon",
  dayOfWeek: "weekday",
  referrer: "other",
  colorScheme: "light",
  connectionSpeed: "unknown",
  mouseSpeed: "not_available",
  platform: "other",
};

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

function normalizeSignalsObject(raw: Record<string, unknown>): BrowserSignals {
  return {
    timezone: toStringValue(raw.timezone, DEFAULT_SIGNALS.timezone),
    language: toStringValue(raw.language, DEFAULT_SIGNALS.language),
    deviceType: toEnum(raw.deviceType, allowedDeviceTypes, DEFAULT_SIGNALS.deviceType),
    screenSize: toEnum(raw.screenSize, allowedScreenSizes, DEFAULT_SIGNALS.screenSize),
    timeOfDay: toEnum(raw.timeOfDay, allowedTimes, DEFAULT_SIGNALS.timeOfDay),
    dayOfWeek: toEnum(raw.dayOfWeek, allowedDays, DEFAULT_SIGNALS.dayOfWeek),
    referrer: toEnum(raw.referrer, allowedReferrers, DEFAULT_SIGNALS.referrer),
    colorScheme: toEnum(raw.colorScheme, allowedColorSchemes, DEFAULT_SIGNALS.colorScheme),
    connectionSpeed: toEnum(
      raw.connectionSpeed,
      allowedSpeeds,
      DEFAULT_SIGNALS.connectionSpeed,
    ),
    mouseSpeed: toEnum(raw.mouseSpeed, allowedMouseSpeeds, DEFAULT_SIGNALS.mouseSpeed),
    platform: toEnum(raw.platform, allowedPlatforms, DEFAULT_SIGNALS.platform),
  };
}

export function parseSignalsWithDefaults(input: unknown): BrowserSignals {
  if (!input || typeof input !== "object") {
    return { ...DEFAULT_SIGNALS };
  }

  return normalizeSignalsObject(input as Record<string, unknown>);
}

export function parseSignalsIfObject(input: unknown): BrowserSignals | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  return normalizeSignalsObject(input as Record<string, unknown>);
}