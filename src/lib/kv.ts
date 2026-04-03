import { kv } from "@vercel/kv";

import type { BrowserSignals, GhostLink, SignalLog, Tone } from "@/types";

const KV_KEY_PREFIX = "ghostlink:";
const MAX_SIGNAL_LOGS = 100;

type GhostLinkGlobal = {
  __ghostLinkMemoryStore__?: Map<string, GhostLink>;
};

const globalStore = globalThis as unknown as GhostLinkGlobal;

if (!globalStore.__ghostLinkMemoryStore__) {
  globalStore.__ghostLinkMemoryStore__ = new Map<string, GhostLink>();
}

const memoryStore = globalStore.__ghostLinkMemoryStore__;

function hasKvConfig(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function keyForSlug(slug: string): string {
  return `${KV_KEY_PREFIX}${slug}`;
}

export async function saveGhostLink(link: GhostLink): Promise<void> {
  memoryStore.set(link.id, link);

  if (!hasKvConfig()) {
    return;
  }

  try {
    await kv.set(keyForSlug(link.id), link);
  } catch (error) {
    console.error("KV set failed, using in-memory store", error);
  }
}

export async function getGhostLink(slug: string): Promise<GhostLink | null> {
  if (hasKvConfig()) {
    try {
      const found = await kv.get<GhostLink>(keyForSlug(slug));
      if (found) {
        memoryStore.set(slug, found);
        return found;
      }
    } catch (error) {
      console.error("KV get failed, falling back to in-memory store", error);
    }
  }

  return memoryStore.get(slug) ?? null;
}

export async function recordVisit(
  slug: string,
  signals: BrowserSignals,
  aiPersonality: string,
  toneServed: Tone | "unknown",
): Promise<GhostLink | null> {
  const link = await getGhostLink(slug);
  if (!link) {
    return null;
  }

  const log: SignalLog = {
    timestamp: new Date().toISOString(),
    signals,
    aiPersonality,
    toneServed,
  };

  const updated: GhostLink = {
    ...link,
    visits: link.visits + 1,
    signals: [log, ...link.signals].slice(0, MAX_SIGNAL_LOGS),
  };

  await saveGhostLink(updated);
  return updated;
}
