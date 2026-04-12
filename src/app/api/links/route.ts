import { NextRequest, NextResponse } from "next/server";

import { deleteGhostLink, getGhostLink, listGhostLinks, saveGhostLink } from "@/lib/kv";
import { sanitizeLinkPayload, type LinkPayloadInput } from "@/lib/linkPayload";
import type { GhostLink, LinkSummary, LinksResponse } from "@/types";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const MIN_SECRET_LENGTH = 32;

type LinkMutationPayloadInput = LinkPayloadInput & {
  id?: unknown;
  secret?: unknown;
};

function resolveBaseUrl(request: NextRequest): string {
  const headerHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const headerProto = request.headers.get("x-forwarded-proto");
  const vercelHost = process.env.VERCEL_URL?.trim();
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (headerHost) {
    const protocol = headerProto ?? (headerHost.includes("localhost") ? "http" : "https");
    return `${protocol}://${headerHost}`.replace(/\/+$/, "");
  }

  if (vercelHost) {
    return `https://${vercelHost}`.replace(/\/+$/, "");
  }

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

function parseLimit(rawValue: string | null): number {
  if (!rawValue) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(parsed)));
}

function normalizeLinkId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return normalized;
}

function normalizeLinkSecret(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (normalized.length < MIN_SECRET_LENGTH) {
    return null;
  }

  return normalized;
}

function parseIdentity(payload: LinkMutationPayloadInput): {
  id: string;
  secret: string;
} | null {
  const id = normalizeLinkId(payload.id);
  const secret = normalizeLinkSecret(payload.secret);

  if (!id || !secret) {
    return null;
  }

  return { id, secret };
}

export async function GET(request: NextRequest) {
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const baseUrl = resolveBaseUrl(request);

  const links = await listGhostLinks(limit);

  const summaries: LinkSummary[] = links.map((link) => {
    return {
      id: link.id,
      url: `${baseUrl}/g/${link.id}`,
      title: link.originalContent.title,
      createdAt: link.createdAt,
      visits: link.visits,
      recentSignals: link.signals.slice(0, 5),
    };
  });

  return NextResponse.json({
    links: summaries,
  } satisfies LinksResponse);
}

export async function DELETE(request: NextRequest) {
  let payload: LinkMutationPayloadInput;
  try {
    payload = (await request.json()) as LinkMutationPayloadInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const identity = parseIdentity(payload);
  if (!identity) {
    return NextResponse.json(
      { error: "Request must include id and secret." },
      { status: 400 },
    );
  }

  try {
    const link = await getGhostLink(identity.id);
    if (!link) {
      return NextResponse.json({ error: "GhostLink not found." }, { status: 404 });
    }

    if (!link.secret || link.secret !== identity.secret) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid secret for this link." },
        { status: 403 },
      );
    }

    const deleted = await deleteGhostLink(identity.id);
    if (!deleted) {
      return NextResponse.json({ error: "GhostLink not found." }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json(
      { error: "Failed to delete link. Please try again." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  let payload: LinkMutationPayloadInput;
  try {
    payload = (await request.json()) as LinkMutationPayloadInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const identity = parseIdentity(payload);
  if (!identity) {
    return NextResponse.json(
      { error: "Request must include id and secret." },
      { status: 400 },
    );
  }

  try {
    const link = await getGhostLink(identity.id);
    if (!link) {
      return NextResponse.json({ error: "GhostLink not found." }, { status: 404 });
    }

    if (!link.secret || link.secret !== identity.secret) {
      return NextResponse.json(
        { error: "Unauthorized. Invalid secret for this link." },
        { status: 403 },
      );
    }

    const sanitized = sanitizeLinkPayload(payload);
    const updated: GhostLink = {
      ...link,
      originalContent: sanitized.originalContent,
      messageMode: sanitized.messageMode,
      ...(sanitized.messageMode === "multi"
        ? {
            messages: sanitized.messages ?? [],
            defaultMessageId: sanitized.defaultMessageId,
          }
        : {
            messages: [],
            defaultMessageId: undefined,
          }),
    };

    await saveGhostLink(updated);

    return NextResponse.json({
      updated: true,
      id: updated.id,
    });
  } catch (error) {
    console.error("Update failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update link." },
      { status: 400 },
    );
  }
}
