import { createGhostLinkUserId, normalizeGhostLinkUserId } from "@/lib/ownership";

const LOCAL_USER_ID_KEY = "ghostlink_userid";
const LOCAL_LINKS_KEY = "ghostlink_mylinks";
const SLUG_PATTERN = /^[a-z0-9-]{3,64}$/;

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeSlug(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!SLUG_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function parseSlugArray(rawValue: string | null): string[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return Array.from(
      new Set(
        parsed
          .map((value) => normalizeSlug(value))
          .filter((value): value is string => Boolean(value)),
      ),
    );
  } catch {
    return [];
  }
}

function storeSlugArray(slugs: string[]): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(LOCAL_LINKS_KEY, JSON.stringify(slugs));
}

export function getOrCreateGhostLinkUserId(): string {
  const fallback = createGhostLinkUserId();

  if (!canUseLocalStorage()) {
    return fallback;
  }

  const existing = normalizeGhostLinkUserId(window.localStorage.getItem(LOCAL_USER_ID_KEY));
  if (existing) {
    return existing;
  }

  window.localStorage.setItem(LOCAL_USER_ID_KEY, fallback);
  return fallback;
}

export function getStoredGhostLinkSlugs(): string[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  return parseSlugArray(window.localStorage.getItem(LOCAL_LINKS_KEY));
}

export function addStoredGhostLinkSlug(slug: string): void {
  if (!canUseLocalStorage()) {
    return;
  }

  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return;
  }

  const existing = getStoredGhostLinkSlugs();
  if (existing.includes(normalizedSlug)) {
    return;
  }

  storeSlugArray([...existing, normalizedSlug]);
}

export function removeStoredGhostLinkSlug(slug: string): void {
  if (!canUseLocalStorage()) {
    return;
  }

  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return;
  }

  const existing = getStoredGhostLinkSlugs();
  const next = existing.filter((entry) => entry !== normalizedSlug);

  if (next.length === existing.length) {
    return;
  }

  storeSlugArray(next);
}
