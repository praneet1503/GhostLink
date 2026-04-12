import { createGhostLinkUserId, normalizeGhostLinkUserId } from "@/lib/ownership";

const LOCAL_USER_ID_KEY = "ghostlink_userid";
const LOCAL_OWNED_LINKS_KEY = "my_links";
const LINK_ID_PATTERN = /^[a-z0-9-]{3,64}$/;
const MIN_SECRET_LENGTH = 32;

export type OwnedLinkRecord = {
  linkId: string;
  secret: string;
};

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeLinkId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!LINK_ID_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function normalizeSecret(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (normalized.length < MIN_SECRET_LENGTH) {
    return null;
  }

  return normalized;
}

function parseOwnedLinkArray(rawValue: string | null): OwnedLinkRecord[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const uniqueRecords = new Map<string, string>();

    parsed.forEach((value) => {
      if (!value || typeof value !== "object") {
        return;
      }

      const rawRecord = value as Record<string, unknown>;
      const linkId = normalizeLinkId(rawRecord.linkId);
      const secret = normalizeSecret(rawRecord.secret);

      if (!linkId || !secret) {
        return;
      }

      uniqueRecords.set(linkId, secret);
    });

    return Array.from(uniqueRecords.entries()).map(([linkId, secret]) => {
      return { linkId, secret };
    });
  } catch {
    return [];
  }
}

function storeOwnedLinkArray(records: OwnedLinkRecord[]): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(LOCAL_OWNED_LINKS_KEY, JSON.stringify(records));
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

  return getOwnedLinkRecords().map((record) => record.linkId);
}

export function getOwnedLinkRecords(): OwnedLinkRecord[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  return parseOwnedLinkArray(window.localStorage.getItem(LOCAL_OWNED_LINKS_KEY));
}

export function getOwnedLinkSecretMap(): Record<string, string> {
  return getOwnedLinkRecords().reduce<Record<string, string>>((acc, record) => {
    acc[record.linkId] = record.secret;
    return acc;
  }, {});
}

export function addOwnedLinkRecord(linkId: string, secret: string): void {
  if (!canUseLocalStorage()) {
    return;
  }

  const normalizedLinkId = normalizeLinkId(linkId);
  const normalizedSecret = normalizeSecret(secret);
  if (!normalizedLinkId || !normalizedSecret) {
    return;
  }

  const existingMap = getOwnedLinkSecretMap();
  existingMap[normalizedLinkId] = normalizedSecret;
  const updated = Object.entries(existingMap).map(([nextLinkId, nextSecret]) => {
    return {
      linkId: nextLinkId,
      secret: nextSecret,
    };
  });

  storeOwnedLinkArray(updated);
}

export function removeOwnedLinkRecord(linkId: string): void {
  if (!canUseLocalStorage()) {
    return;
  }

  const normalizedLinkId = normalizeLinkId(linkId);
  if (!normalizedLinkId) {
    return;
  }

  const existing = getOwnedLinkRecords();
  const next = existing.filter((entry) => entry.linkId !== normalizedLinkId);

  if (next.length === existing.length) {
    return;
  }

  storeOwnedLinkArray(next);
}

export function getOwnedLinkSecret(linkId: string): string | null {
  const normalizedLinkId = normalizeLinkId(linkId);
  if (!normalizedLinkId) {
    return null;
  }

  return getOwnedLinkSecretMap()[normalizedLinkId] ?? null;
}

// Backward-compatible aliases for callers updated in this patch.
export function addStoredGhostLinkSlug(linkId: string, secret: string): void {
  addOwnedLinkRecord(linkId, secret);
}

export function removeStoredGhostLinkSlug(linkId: string): void {
  removeOwnedLinkRecord(linkId);
}
