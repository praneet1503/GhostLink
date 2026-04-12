export const GHOSTLINK_USER_HEADER = "x-ghostlink-user-id";

const MIN_USER_ID_LENGTH = 16;
const MAX_USER_ID_LENGTH = 128;
const USER_ID_PATTERN = /^[a-zA-Z0-9-]+$/;

export function createGhostLinkUserId(): string {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

  return `gl-${randomPart}`;
}

export function normalizeGhostLinkUserId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (normalized.length < MIN_USER_ID_LENGTH || normalized.length > MAX_USER_ID_LENGTH) {
    return null;
  }

  if (!USER_ID_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

export function getGhostLinkUserIdFromHeaders(headers: Headers): string | null {
  return normalizeGhostLinkUserId(headers.get(GHOSTLINK_USER_HEADER));
}
