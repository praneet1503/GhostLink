import { NextRequest, NextResponse } from "next/server";

import { getGhostLink } from "@/lib/kv";
import { selectMessageForSignals } from "@/lib/messageRouting";
import { buildFallbackOriginalContent } from "@/lib/personalization";
import { toStringValue } from "@/lib/requestValues";
import { parseSignalsIfObject } from "@/lib/signalValidation";

type MessageRoutePayloadInput = {
  slug?: unknown;
  signals?: unknown;
};

export async function POST(request: NextRequest) {
  let payload: MessageRoutePayloadInput;

  try {
    payload = (await request.json()) as MessageRoutePayloadInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const slug = toStringValue(payload.slug, "");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug." }, { status: 400 });
  }

  const signals = parseSignalsIfObject(payload.signals);
  if (!signals) {
    return NextResponse.json({ error: "Missing or invalid signals." }, { status: 400 });
  }

  const link = await getGhostLink(slug);
  if (!link) {
    return NextResponse.json({ error: "GhostLink not found." }, { status: 404 });
  }

  if (link.messageMode !== "multi" || !link.messages || link.messages.length === 0) {
    return NextResponse.json(
      { error: "This link does not use multi-message routing." },
      { status: 400 },
    );
  }

  const selection = await selectMessageForSignals(
    signals,
    link.messages,
    link.defaultMessageId,
  );

  return NextResponse.json({
    selectedMessageId: selection.message.id,
    matchType: selection.matchType,
    source: selection.source,
    aiPersonality: selection.aiPersonality,
    content: buildFallbackOriginalContent(selection.message.content, signals),
  });
}
