import { kv } from "@vercel/kv";

import type { BrowserSignals, GhostLink, SignalLog, Tone } from "@/types";

const KV_KEY_PREFIX = "ghostlink:";
const KV_INDEX_KEY = `${KV_KEY_PREFIX}index`;
const MAX_SIGNAL_LOGS = 100;

type GhostLinkGlobal = {
  __ghostLinkMemoryStore__?: Map<string, GhostLink>;
  __ghostLinkMemoryIndex__?: Set<string>;
};

const globalStore = globalThis as unknown as GhostLinkGlobal;

if (!globalStore.__ghostLinkMemoryStore__) {
  globalStore.__ghostLinkMemoryStore__ = new Map<string, GhostLink>();
}

if (!globalStore.__ghostLinkMemoryIndex__) {
  globalStore.__ghostLinkMemoryIndex__ = new Set<string>();
}

const memoryStore = globalStore.__ghostLinkMemoryStore__;
const memoryIndex = globalStore.__ghostLinkMemoryIndex__;

function hasKvConfig(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function keyForSlug(slug: string): string {
  return `${KV_KEY_PREFIX}${slug}`;
}

async function addSlugToIndex(slug: string): Promise<void> {
  memoryIndex.add(slug);

  if (!hasKvConfig()) {
    return;
  }

  try {
    await kv.sadd(KV_INDEX_KEY, slug);
  } catch (error) {
    console.error("KV index update failed, using in-memory index", error);
  }
}

export async function saveGhostLink(link: GhostLink): Promise<void> {
  memoryStore.set(link.id, link);
  await addSlugToIndex(link.id);

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
        memoryIndex.add(slug);
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

export async function listGhostLinks(limit = 100): Promise<GhostLink[]> {
  let slugs: string[] = [];

  if (hasKvConfig()) {
    try {
      const indexedSlugs = await kv.smembers(KV_INDEX_KEY);
      if (Array.isArray(indexedSlugs) && indexedSlugs.length > 0) {
        slugs = indexedSlugs
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter((value) => value.length > 0);

        slugs.forEach((slug) => {
          memoryIndex.add(slug);
        });
      }
    } catch (error) {
      console.error("KV index read failed, falling back to in-memory index", error);
    }
  }

  if (slugs.length === 0) {
    const indexed = Array.from(memoryIndex);
    const stored = Array.from(memoryStore.keys());
    slugs = Array.from(new Set([...indexed, ...stored]));
  }

  const links = await Promise.all(
    slugs.map(async (slug) => {
      return getGhostLink(slug);
    }),
  );

  return links
    .filter((link): link is GhostLink => Boolean(link))
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, Math.max(1, limit));
}
