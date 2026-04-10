import { del as blobDel, get as blobGet, list as blobList, put as blobPut } from "@vercel/blob";

import type {
  BrowserSignals,
  GhostLink,
  MessageCondition,
  MessageVariant,
  ResolveMatchType,
  SignalLog,
  Tone,
} from "@/types";
import {
  isAllowedOperatorForSignal,
  isAllowedValueForSignal,
  isRuleSignalKey,
  parseConditionValueList,
  stringifyConditionValueList,
} from "@/lib/ruleConditions";

const BLOB_LINK_PREFIX = "ghostlink/links/";
const BLOB_LINK_SUFFIX = ".json";
const BLOB_LIST_PAGE_LIMIT = 1000;
const EDGE_CONFIG_INDEX_KEY = "ghostlink-index";
const EDGE_CONFIG_API_BASE = "https://api.vercel.com/v1/edge-config";
const EDGE_CONFIG_READ_BASE = "https://edge-config.vercel.com";
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

let hasHydratedIndex = false;

function hasBlobConfig(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function parseEdgeConfigConnectionString(): {
  id: string;
  token: string;
} | null {
  const connectionString = process.env.EDGE_CONFIG?.trim();
  if (!connectionString) {
    return null;
  }

  try {
    const parsed = new URL(connectionString);
    const id = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    const token = parsed.searchParams.get("token")?.trim() ?? "";

    if (!id || !token) {
      return null;
    }

    return { id, token };
  } catch {
    return null;
  }
}

function hasEdgeConfigReadConfig(): boolean {
  return Boolean(edgeConfigId() && edgeConfigReadToken());
}

function edgeConfigId(): string {
  const explicit = process.env.EDGE_CONFIG_ID?.trim();
  if (explicit) {
    return explicit;
  }

  return parseEdgeConfigConnectionString()?.id ?? "";
}

function edgeConfigReadToken(): string {
  const explicit = process.env.EDGE_CONFIG_TOKEN?.trim();
  if (explicit) {
    return explicit;
  }

  return parseEdgeConfigConnectionString()?.token ?? "";
}

function blobPathForSlug(slug: string): string {
  return `${BLOB_LINK_PREFIX}${slug}${BLOB_LINK_SUFFIX}`;
}

function slugFromBlobPath(pathname: string): string | null {
  if (!pathname.startsWith(BLOB_LINK_PREFIX) || !pathname.endsWith(BLOB_LINK_SUFFIX)) {
    return null;
  }

  const slug = pathname
    .slice(BLOB_LINK_PREFIX.length, pathname.length - BLOB_LINK_SUFFIX.length)
    .trim();

  return slug || null;
}

function normalizeSlugArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function toErrorString(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function createFallbackMessageVariant(link: GhostLink): MessageVariant {
  return {
    id: "single-default",
    content: link.originalContent,
    conditions: [],
    priority: 1,
    createdAt: link.createdAt,
  };
}

function sanitizeConditions(value: unknown): MessageCondition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): MessageCondition | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const raw = item as Record<string, unknown>;
      const signal =
        typeof raw.signal === "string" && isRuleSignalKey(raw.signal)
          ? raw.signal
          : null;
      const operator = typeof raw.operator === "string" ? raw.operator : null;

      if (!signal || !operator) {
        return null;
      }

      if (!isAllowedOperatorForSignal(signal, operator as MessageCondition["operator"])) {
        return null;
      }

      const rawValue = raw.value;
      if (operator === "oneOf") {
        const values = Array.isArray(rawValue)
          ? rawValue
              .filter((entry): entry is string => typeof entry === "string")
              .map((entry) => entry.trim())
              .filter((entry) => isAllowedValueForSignal(signal, entry))
          : typeof rawValue === "string"
            ? parseConditionValueList(rawValue).filter((entry) => {
                return isAllowedValueForSignal(signal, entry);
              })
            : [];

        if (values.length === 0) {
          return null;
        }

        return {
          signal: signal as MessageCondition["signal"],
          operator: operator as MessageCondition["operator"],
          value: parseConditionValueList(stringifyConditionValueList(values)),
        };
      }

      if (typeof rawValue !== "string") {
        return null;
      }

      const normalized = rawValue.trim();
      if (!normalized || !isAllowedValueForSignal(signal, normalized)) {
        return null;
      }

      return {
        signal: signal as MessageCondition["signal"],
        operator: operator as MessageCondition["operator"],
        value: normalized,
      };
    })
    .filter((item): item is MessageCondition => Boolean(item));
}

function sanitizeMessageVariants(link: GhostLink, value: unknown): MessageVariant[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const variants = value
    .map((item, index): MessageVariant | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const raw = item as Record<string, unknown>;
      const id = typeof raw.id === "string" ? raw.id.trim() : "";
      const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : link.createdAt;
      const priority =
        typeof raw.priority === "number" && Number.isFinite(raw.priority)
          ? Math.max(1, Math.floor(raw.priority))
          : index + 1;

      const rawContent = raw.content;
      if (!rawContent || typeof rawContent !== "object") {
        return null;
      }

      const contentObj = rawContent as Record<string, unknown>;
      const title = typeof contentObj.title === "string" ? contentObj.title.trim() : "";
      const body = typeof contentObj.body === "string" ? contentObj.body.trim() : "";
      if (!title || !body) {
        return null;
      }

      const cta = typeof contentObj.cta === "string" ? contentObj.cta.trim() : "";
      const ctaUrl = typeof contentObj.ctaUrl === "string" ? contentObj.ctaUrl.trim() : "";

      return {
        id: id || `message-${index + 1}`,
        content: {
          title,
          body,
          ...(cta ? { cta } : {}),
          ...(ctaUrl ? { ctaUrl } : {}),
        },
        conditions: sanitizeConditions(raw.conditions),
        priority,
        createdAt,
      };
    })
    .filter((item): item is MessageVariant => Boolean(item))
    .sort((a, b) => a.priority - b.priority);

  return variants;
}

function normalizeGhostLink(link: GhostLink): GhostLink {
  const messageMode = link.messageMode === "multi" ? "multi" : "single";
  const messages = sanitizeMessageVariants(link, link.messages);
  const safeMessages =
    messages.length > 0
      ? messages
      : messageMode === "multi"
        ? [createFallbackMessageVariant(link)]
        : [];

  const defaultMessageId =
    typeof link.defaultMessageId === "string" &&
    safeMessages.some((message) => message.id === link.defaultMessageId)
      ? link.defaultMessageId
      : safeMessages[0]?.id;

  return {
    ...link,
    messageMode,
    messages: safeMessages,
    defaultMessageId,
  };
}

function parseGhostLink(raw: string): GhostLink | null {
  try {
    const parsed = JSON.parse(raw) as GhostLink;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    if (typeof parsed.id !== "string" || typeof parsed.createdAt !== "string") {
      return null;
    }

    if (!parsed.originalContent || typeof parsed.originalContent !== "object") {
      return null;
    }

    return normalizeGhostLink(parsed);
  } catch {
    return null;
  }
}

async function readEdgeConfigIndex(): Promise<string[] | null> {
  if (!hasEdgeConfigReadConfig()) {
    return null;
  }

  const id = edgeConfigId();
  const token = edgeConfigReadToken();
  if (!id || !token) {
    return null;
  }

  const endpoint = `${EDGE_CONFIG_READ_BASE}/${encodeURIComponent(id)}/item/${encodeURIComponent(
    EDGE_CONFIG_INDEX_KEY,
  )}`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }

    const value = (await response.json()) as unknown;
    if (typeof value === "string") {
      try {
        return normalizeSlugArray(JSON.parse(value) as unknown);
      } catch {
        return [];
      }
    }

    return normalizeSlugArray(value);
  } catch (error) {
    console.error("Edge Config index read failed", toErrorString(error));
    return null;
  }
}

async function writeEdgeConfigIndex(slugs: string[]): Promise<void> {
  // Write operations via Edge Config REST API require a Vercel API token.
  // The project is configured to operate without this by relying on Blob and
  // in-memory indices. This function is intentionally a no-op in that case.
  return;
}

async function listSlugsFromBlob(limit = 5000): Promise<string[]> {
  if (!hasBlobConfig()) {
    return [];
  }

  const slugs: string[] = [];
  let hasMore = true;
  let cursor: string | undefined;

  try {
    while (hasMore && slugs.length < limit) {
      const pageLimit = Math.min(BLOB_LIST_PAGE_LIMIT, Math.max(1, limit - slugs.length));
      const page = await blobList({
        prefix: BLOB_LINK_PREFIX,
        limit: pageLimit,
        ...(cursor ? { cursor } : {}),
      });

      page.blobs.forEach((blob) => {
        const slug = slugFromBlobPath(blob.pathname);
        if (slug) {
          slugs.push(slug);
        }
      });

      hasMore = page.hasMore;
      cursor = page.cursor;
    }
  } catch (error) {
    console.error("Blob list failed", toErrorString(error));
    return [];
  }

  return Array.from(new Set(slugs));
}

async function hydrateIndex(): Promise<void> {
  if (hasHydratedIndex) {
    return;
  }

  hasHydratedIndex = true;

  const edgeSlugs = await readEdgeConfigIndex();
  if (edgeSlugs && edgeSlugs.length > 0) {
    edgeSlugs.forEach((slug) => {
      memoryIndex.add(slug);
    });
  }

  if (memoryIndex.size === 0) {
    const blobSlugs = await listSlugsFromBlob();
    blobSlugs.forEach((slug) => {
      memoryIndex.add(slug);
    });
  }
}

async function addSlugToIndex(slug: string): Promise<void> {
  await hydrateIndex();
  memoryIndex.add(slug);

  // Edge Config writes are disabled in the no-API-token configuration.
  // Blob-based listing remains the primary index source.
  await writeEdgeConfigIndex(Array.from(memoryIndex));
}

async function saveGhostLinkToBlob(link: GhostLink): Promise<void> {
  if (!hasBlobConfig()) {
    return;
  }

  try {
    await blobPut(blobPathForSlug(link.id), JSON.stringify(link), {
      access: "private",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
    });
  } catch (error) {
    console.error("Blob put failed, using in-memory store", toErrorString(error));
  }
}

async function getGhostLinkFromBlob(slug: string): Promise<GhostLink | null> {
  if (!hasBlobConfig()) {
    return null;
  }

  try {
    const result = await blobGet(blobPathForSlug(slug), {
      access: "private",
    });

    if (!result) {
      return null;
    }

    if ("stream" in result && result.stream) {
      const payload = await new Response(result.stream).text();
      return parseGhostLink(payload);
    }

    const readUrl =
      ("downloadUrl" in result && typeof result.downloadUrl === "string"
        ? result.downloadUrl
        : undefined) ??
      ("url" in result && typeof result.url === "string"
        ? result.url
        : undefined) ??
      ("blob" in result &&
      result.blob &&
      typeof result.blob === "object" &&
      "url" in result.blob &&
      typeof result.blob.url === "string"
        ? result.blob.url
        : undefined);

    if (!readUrl) {
      return null;
    }

    const response = await fetch(readUrl, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const payload = await response.text();
    return parseGhostLink(payload);
  } catch (error) {
    console.error("Blob get failed, falling back to in-memory store", toErrorString(error));
    return null;
  }
}

export async function saveGhostLink(link: GhostLink): Promise<void> {
  const normalized = normalizeGhostLink(link);

  memoryStore.set(normalized.id, normalized);
  await addSlugToIndex(normalized.id);

  await saveGhostLinkToBlob(normalized);
}

export async function getGhostLink(slug: string): Promise<GhostLink | null> {
  const cached = memoryStore.get(slug);
  if (cached) {
    return normalizeGhostLink(cached);
  }

  const found = await getGhostLinkFromBlob(slug);
  if (found) {
    memoryStore.set(slug, normalizeGhostLink(found));
    memoryIndex.add(slug);
    return normalizeGhostLink(found);
  }

  return null;
}

export async function deleteGhostLink(slug: string): Promise<boolean> {
  await hydrateIndex();

  const existing = await getGhostLink(slug);

  if (!existing) {
    return false;
  }

  try {
    await blobDel(blobPathForSlug(slug));
  } catch (error) {
    console.error("Blob delete failed", toErrorString(error));
    throw error;
  }

  memoryStore.delete(slug);
  memoryIndex.delete(slug);

  return true;
}

export async function recordVisit(
  slug: string,
  signals: BrowserSignals,
  aiPersonality: string,
  toneServed: Tone | "unknown",
  context?: {
    matchType?: ResolveMatchType;
    selectedMessageId?: string;
  },
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
    ...(context?.matchType ? { matchType: context.matchType } : {}),
    ...(context?.selectedMessageId
      ? { selectedMessageId: context.selectedMessageId }
      : {}),
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
  await hydrateIndex();

  const edgeSlugs = await readEdgeConfigIndex();
  if (edgeSlugs && edgeSlugs.length > 0) {
    edgeSlugs.forEach((slug) => {
      memoryIndex.add(slug);
    });
  }

  let slugs: string[] = Array.from(memoryIndex);

  if (slugs.length === 0) {
    const blobSlugs = await listSlugsFromBlob();
    blobSlugs.forEach((slug) => {
      memoryIndex.add(slug);
    });

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
