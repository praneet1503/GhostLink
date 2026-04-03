import type {
  BrowserSignals,
  ConnectionSpeed,
  DayOfWeek,
  DeviceType,
  MouseSpeed,
  PlatformType,
  ReferrerType,
  ScreenSize,
  TimeOfDay,
} from "@/types";

interface ConnectionLike {
  effectiveType?: string;
}

interface NavigatorWithConnection extends Navigator {
  connection?: ConnectionLike;
  mozConnection?: ConnectionLike;
  webkitConnection?: ConnectionLike;
}

const MOBILE_REGEX = /Android|iPhone|iPod|Mobi/i;
const TABLET_REGEX = /iPad|Tablet/i;

function getUserAgent(): string {
  if (typeof navigator === "undefined") {
    return "";
  }

  return navigator.userAgent;
}

export function getDeviceType(userAgent: string, width: number): DeviceType {
  if (TABLET_REGEX.test(userAgent) || (MOBILE_REGEX.test(userAgent) && width >= 768)) {
    return "tablet";
  }

  if (MOBILE_REGEX.test(userAgent) || width < 768) {
    return "mobile";
  }

  return "desktop";
}

export function getScreenSize(width: number): ScreenSize {
  if (width < 640) {
    return "small";
  }

  if (width < 1200) {
    return "medium";
  }

  return "large";
}

export function getTimeOfDay(date = new Date()): TimeOfDay {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 22) {
    return "evening";
  }

  return "night";
}

export function getDayOfWeek(date = new Date()): DayOfWeek {
  const day = date.getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

export function parseReferrer(referrer: string): ReferrerType {
  if (!referrer) {
    return "direct";
  }

  const normalized = referrer.toLowerCase();

  if (normalized.includes("linkedin")) {
    return "linkedin";
  }

  if (normalized.includes("whatsapp") || normalized.includes("wa.me")) {
    return "whatsapp";
  }

  if (normalized.includes("twitter") || normalized.includes("x.com")) {
    return "twitter";
  }

  if (normalized.includes("github")) {
    return "github";
  }

  return "other";
}

export function getColorScheme(): "dark" | "light" {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function getConnectionSpeed(): ConnectionSpeed {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
  const effectiveType = connection?.effectiveType?.toLowerCase();

  if (!effectiveType) {
    return "unknown";
  }

  if (
    effectiveType.includes("slow-2g") ||
    effectiveType.includes("2g") ||
    effectiveType.includes("3g")
  ) {
    return "slow";
  }

  return "fast";
}

export function getPlatform(userAgent: string): PlatformType {
  const normalized = userAgent.toLowerCase();

  if (normalized.includes("iphone") || normalized.includes("ipad") || normalized.includes("ios")) {
    return "ios";
  }

  if (normalized.includes("android")) {
    return "android";
  }

  if (normalized.includes("mac")) {
    return "mac";
  }

  if (normalized.includes("win")) {
    return "windows";
  }

  if (normalized.includes("linux")) {
    return "linux";
  }

  return "other";
}

function hasFinePointer(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(pointer: fine)").matches;
}

export function measureMouseSpeed(sampleWindowMs = 1200): Promise<MouseSpeed> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !hasFinePointer()) {
      resolve("not_available");
      return;
    }

    let lastX = 0;
    let lastY = 0;
    let lastTime = performance.now();
    let hasPoint = false;
    let velocitySum = 0;
    let samples = 0;

    const onMove = (event: MouseEvent): void => {
      const now = performance.now();
      if (hasPoint) {
        const dt = Math.max(now - lastTime, 1);
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        velocitySum += distance / dt;
        samples += 1;
      }

      lastX = event.clientX;
      lastY = event.clientY;
      lastTime = now;
      hasPoint = true;
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    window.setTimeout(() => {
      window.removeEventListener("mousemove", onMove);

      if (samples === 0) {
        resolve("not_available");
        return;
      }

      const averageVelocity = velocitySum / samples;
      resolve(averageVelocity >= 0.75 ? "fast" : "slow");
    }, sampleWindowMs);
  });
}

export async function collectBrowserSignals(): Promise<BrowserSignals> {
  const userAgent = getUserAgent();
  const width = typeof window === "undefined" ? 1200 : window.innerWidth;

  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const signals: BrowserSignals = {
    timezone,
    language: typeof navigator === "undefined" ? "en-US" : navigator.language || "en-US",
    deviceType: getDeviceType(userAgent, width),
    screenSize: getScreenSize(width),
    timeOfDay: getTimeOfDay(),
    dayOfWeek: getDayOfWeek(),
    referrer: parseReferrer(typeof document === "undefined" ? "" : document.referrer),
    colorScheme: getColorScheme(),
    connectionSpeed: getConnectionSpeed(),
    mouseSpeed: await measureMouseSpeed(),
    platform: getPlatform(userAgent),
  };

  return signals;
}
