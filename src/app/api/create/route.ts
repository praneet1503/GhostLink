import { randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { getGhostLink, saveGhostLink } from "@/lib/kv";
import { sanitizeLinkPayload, type LinkPayloadInput } from "@/lib/linkPayload";
import { getGhostLinkUserIdFromHeaders } from "@/lib/ownership";
import { createSlug } from "@/lib/slugify";
import type { CreateLinkResponse, GhostLink } from "@/types";

const MAX_SLUG_ATTEMPTS = 8;

function createLinkSecret(): string {
  return randomBytes(32).toString("hex");
}

function resolveBaseUrl(request: NextRequest): string {
  const headerHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const headerProto = request.headers.get("x-forwarded-proto");
  const vercelHost = process.env.VERCEL_URL?.trim();
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  // Always prefer the current request host when present.
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

  const host = "localhost:3000";
  const protocol = "http";
  return `${protocol}://${host}`;
}

async function generateUniqueSlug(): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    const candidate = createSlug();
    const existing = await getGhostLink(candidate);
    if (!existing) {
      return candidate;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const createdBy = getGhostLinkUserIdFromHeaders(request.headers);
  if (!createdBy) {
    return NextResponse.json(
      { error: "Missing or invalid user identity." },
      { status: 401 },
    );
  }

  let payload: LinkPayloadInput;

  try {
    payload = (await request.json()) as LinkPayloadInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const sanitized = sanitizeLinkPayload(payload);

    const slug = await generateUniqueSlug();
    if (!slug) {
      return NextResponse.json(
        { error: "Could not generate a unique link. Please retry." },
        { status: 500 },
      );
    }

    const secret = createLinkSecret();
    const link: GhostLink = {
      id: slug,
      secret,
      createdBy,
      createdAt: new Date().toISOString(),
      originalContent: sanitized.originalContent,
      messageMode: sanitized.messageMode,
      ...(sanitized.messageMode === "multi"
        ? {
            messages: sanitized.messages,
            defaultMessageId: sanitized.defaultMessageId,
          }
        : {}),
      visits: 0,
      signals: [],
    };

    await saveGhostLink(link);

    const baseUrl = resolveBaseUrl(request);
    const response: CreateLinkResponse = {
      id: slug,
      secret,
      url: `${baseUrl}/g/${slug}`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create GhostLink.",
      },
      { status: 400 },
    );
  }
}
