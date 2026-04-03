export type DeviceType = "mobile" | "tablet" | "desktop";

export type ScreenSize = "small" | "medium" | "large";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export type DayOfWeek = "weekday" | "weekend";

export type ReferrerType =
  | "linkedin"
  | "whatsapp"
  | "twitter"
  | "github"
  | "direct"
  | "other";

export type ColorScheme = "dark" | "light";

export type ConnectionSpeed = "slow" | "fast" | "unknown";

export type MouseSpeed = "slow" | "fast" | "not_available";

export type PlatformType =
  | "windows"
  | "mac"
  | "linux"
  | "ios"
  | "android"
  | "other";

export type Tone = "professional" | "casual" | "playful" | "urgent";

export interface BrowserSignals {
  timezone: string;
  language: string;
  deviceType: DeviceType;
  screenSize: ScreenSize;
  timeOfDay: TimeOfDay;
  dayOfWeek: DayOfWeek;
  referrer: ReferrerType;
  colorScheme: ColorScheme;
  connectionSpeed: ConnectionSpeed;
  mouseSpeed: MouseSpeed;
  platform: PlatformType;
}

export interface OriginalContent {
  title: string;
  body: string;
  cta?: string;
  ctaUrl?: string;
  imageUrl?: string;
}

export interface SignalLog {
  timestamp: string;
  signals: BrowserSignals;
  aiPersonality: string;
  toneServed: Tone | "unknown";
}

export interface GhostLink {
  id: string;
  createdAt: string;
  originalContent: OriginalContent;
  visits: number;
  signals: SignalLog[];
}

export interface PersonalizedContent {
  title: string;
  headline: string;
  body: string;
  cta: string;
  ctaUrl?: string;
  tone: Tone;
}

export interface CreateLinkRequest {
  title: string;
  body: string;
  cta?: string;
  ctaUrl?: string;
}

export interface CreateLinkResponse {
  slug: string;
  url: string;
}

export interface ResolveRequest {
  slug: string;
  signals: BrowserSignals;
}

export interface ResolveResponse {
  content: PersonalizedContent;
  source: "ai" | "heuristic" | "fallback";
}
