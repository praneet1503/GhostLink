import { NextRequest, NextResponse } from "next/server";

import { getGhostLink, recordVisit } from "@/lib/kv";
import { selectMessageForSignals } from "@/lib/messageRouting";
import {
  buildFallbackOriginalContent,
  buildHeuristicContent,
  inferPersonality,
} from "@/lib/personalization";
import { toStringValue } from "@/lib/requestValues";
import {
  OpenRouterTimeoutError,
  hasOpenRouterApiKey,
  personalizeWithOpenRouter,
} from "@/lib/openrouter";
import { parseSignalsWithDefaults } from "@/lib/signalValidation";
import type { ResolveResponse } from "@/types";

type ResolvePayloadInput = {
  slug?: unknown;
  signals?: unknown;
  browserSignals?: unknown;
};

function deriveSlugFromReferer(referer: string | null): string {
  if (!referer) {
    return "";
  }

  try {
    const parsed = new URL(referer);
    const match = parsed.pathname.match(/^\/g\/([^/?#]+)/i);
    return match?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  let payload: ResolvePayloadInput = {};

  try {
    payload = (await request.json()) as ResolvePayloadInput;
  } catch {
    payload = {};
  }

  const slug = toStringValue(
    payload.slug ??
      request.nextUrl.searchParams.get("slug") ??
      deriveSlugFromReferer(request.headers.get("referer")),
    "",
  );
  if (!slug) {
    return NextResponse.json({ error: "Missing slug." }, { status: 400 });
  }

  const signals = parseSignalsWithDefaults(payload.signals ?? payload.browserSignals);

  const link = await getGhostLink(slug);
  if (!link) {
    return NextResponse.json({ error: "GhostLink not found." }, { status: 404 });
  }

  if (link.messageMode === "multi" && link.messages && link.messages.length > 0) {
    const selection = await selectMessageForSignals(
      signals,
      link.messages,
      link.defaultMessageId,
    );

    const content = buildFallbackOriginalContent(selection.message.content, signals);

    await recordVisit(slug, signals, selection.aiPersonality, content.tone, {
      matchType: selection.matchType,
      selectedMessageId: selection.message.id,
    });

    return NextResponse.json({
      content,
      source: selection.source,
      matchType: selection.matchType,
      selectedMessageId: selection.message.id,
    } satisfies ResolveResponse);
  }

  let content = buildHeuristicContent(link.originalContent, signals);
  let personality = inferPersonality(signals);
  let source: ResolveResponse["source"] = "heuristic";

  if (hasOpenRouterApiKey()) {
    try {
      const aiResult = await personalizeWithOpenRouter(link.originalContent, signals);
      content = aiResult.content;
      personality = aiResult.aiPersonality;
      source = "ai";
    } catch (error) {
      console.error("OpenRouter personalization failed", error);
      content = buildFallbackOriginalContent(link.originalContent, signals);
      source = "fallback";

      if (error instanceof OpenRouterTimeoutError) {
        personality = `${personality} (timeout fallback)`;
      }
    }
  }

  await recordVisit(slug, signals, personality, content.tone);

  return NextResponse.json({
    content,
    source,
  } satisfies ResolveResponse);
}
