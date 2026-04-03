import type {
  BrowserSignals,
  OriginalContent,
  PersonalizedContent,
  ReferrerType,
  Tone,
} from "@/types";

export function inferTone(signals: BrowserSignals): Tone {
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

export function inferPersonality(signals: BrowserSignals): string {
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

export function buildHeuristicContent(
  content: OriginalContent,
  signals: BrowserSignals,
): PersonalizedContent {
  const tone = inferTone(signals);
  const prefix = getHeadlinePrefix(signals.referrer, tone);

  return {
    title: content.title,
    headline: `${prefix} ${content.title}`,
    body: content.body,
    cta: content.cta ?? "Explore more",
    ctaUrl: content.ctaUrl,
    tone,
  };
}

export function buildFallbackOriginalContent(
  content: OriginalContent,
  signals: BrowserSignals,
): PersonalizedContent {
  return {
    title: content.title,
    headline: content.title,
    body: content.body,
    cta: content.cta ?? "Explore more",
    ctaUrl: content.ctaUrl,
    tone: inferTone(signals),
  };
}
