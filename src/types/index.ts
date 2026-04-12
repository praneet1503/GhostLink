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

export type MessageMode = "single" | "multi";

export type SignalKey = keyof BrowserSignals;

export type ConditionOperator = "equals" | "includes" | "oneOf";

export type ResolveMatchType = "rule" | "ai" | "default";

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

export interface MessageCondition {
  signal: SignalKey;
  operator: ConditionOperator;
  value: string | string[];
}

export interface MessageVariant {
  id: string;
  content: OriginalContent;
  conditions: MessageCondition[];
  priority: number;
  createdAt: string;
}

export interface SignalLog {
  timestamp: string;
  signals: BrowserSignals;
  aiPersonality: string;
  toneServed: Tone | "unknown";
  matchType?: ResolveMatchType;
  selectedMessageId?: string;
}

export interface GhostLink {
  id: string;
  createdBy?: string;
  createdAt: string;
  originalContent: OriginalContent;
  messageMode?: MessageMode;
  messages?: MessageVariant[];
  defaultMessageId?: string;
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

export interface CreateLinkResponse {
  slug: string;
  url: string;
}

export interface ResolveResponse {
  content: PersonalizedContent;
  source: "ai" | "heuristic" | "fallback" | "rule";
  matchType?: ResolveMatchType;
  selectedMessageId?: string;
}

export interface LinkSummary {
  id: string;
  url: string;
  title: string;
  createdAt: string;
  visits: number;
  recentSignals: SignalLog[];
}

export interface TopLinkPerformance {
  id: string;
  url: string;
  title: string;
  visits: number;
}

export interface LinksResponse {
  links: LinkSummary[];
}

export interface AnalyticsResponse {
  slug: string;
  visits: number;
  tones: Record<string, number>;
  referrers: Record<string, number>;
  devices: Record<string, number>;
  highestPerformingLink: TopLinkPerformance | null;
  recentSignals: SignalLog[];
}
