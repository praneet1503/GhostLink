import { NextRequest, NextResponse } from "next/server";

import { getGhostLink, saveGhostLink } from "@/lib/kv";
import { createSlug } from "@/lib/slugify";
import type { CreateLinkResponse, GhostLink, OriginalContent } from "@/types";

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 7000;
const MAX_CTA_LENGTH = 80;
const MAX_URL_LENGTH = 2000;
const MAX_SLUG_ATTEMPTS = 8;

type CreatePayloadInput = {
  title?: unknown;
  body?: unknown;
  cta?: unknown;
  ctaUrl?: unknown;
  imageUrl?: unknown;
};

function sanitizeRequiredText(
  value: unknown,
  maxLength: number,
  fieldName: string,
): string {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} is required.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} is too long.`);
  }

  return normalized;
}

function sanitizeOptionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, maxLength);
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost:3000";

  const protocol =
    request.headers.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");

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
  let payload: CreatePayloadInput;

  try {
    payload = (await request.json()) as CreatePayloadInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const title = sanitizeRequiredText(payload.title, MAX_TITLE_LENGTH, "Title");
    const body = sanitizeRequiredText(payload.body, MAX_BODY_LENGTH, "Body");
    const cta = sanitizeOptionalText(payload.cta, MAX_CTA_LENGTH);
    const ctaUrl = sanitizeOptionalText(payload.ctaUrl, MAX_URL_LENGTH);

    if (ctaUrl && !isValidHttpUrl(ctaUrl)) {
      return NextResponse.json(
        { error: "Call to action URL must start with http:// or https://." },
        { status: 400 },
      );
    }

    const slug = await generateUniqueSlug();
    if (!slug) {
      return NextResponse.json(
        { error: "Could not generate a unique link. Please retry." },
        { status: 500 },
      );
    }

    const originalContent: OriginalContent = {
      title,
      body,
      ...(cta ? { cta } : {}),
      ...(ctaUrl ? { ctaUrl } : {}),
    };

    const link: GhostLink = {
      id: slug,
      createdAt: new Date().toISOString(),
      originalContent,
      visits: 0,
      signals: [],
    };

    await saveGhostLink(link);

    const baseUrl = resolveBaseUrl(request);
    const response: CreateLinkResponse = {
      slug,
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
