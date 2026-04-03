import type {
  BrowserSignals,
  OriginalContent,
  PersonalizedContent,
  Tone,
} from "@/types";

export const OPENROUTER_MODEL = "mistralai/mistral-7b-instruct:free";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_TIMEOUT_MS = 10_000;

const SYSTEM_PROMPT = `You are a content personalization engine.
You receive:
1) Original content (portfolio, message, product page, etc.)
2) Browser signals about the visitor

Your job:
- Rewrite and restructure the content so it feels tailored to this visitor.
- You may change tone, emphasis, ordering, and style.
- You must not invent facts or claims not present in the original content.
- Keep it concise and clear.

Return ONLY valid JSON with this exact schema:
{
  "title": "string",
  "headline": "string",
  "body": "string",
  "cta": "string",
  "tone": "professional | casual | playful | urgent",
  "aiPersonality": "string"
}`;

const toneValues = new Set<Tone>([
  "professional",
  "casual",
  "playful",
  "urgent",
]);

interface OpenRouterChoice {
  message?: {
    content?: string | null;
  };
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
}

interface AiPayload {
  title: string;
  headline: string;
  body: string;
  cta: string;
  tone: Tone;
  aiPersonality: string;
}

export interface OpenRouterPersonalization {
  content: PersonalizedContent;
  aiPersonality: string;
}

export class OpenRouterTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterTimeoutError";
  }
}

export function hasOpenRouterApiKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

function resolveHttpReferer(): string {
  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    return `https://${vercelHost}`;
  }

  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

function getString(value: unknown, fieldName: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new Error(`OpenRouter output missing ${fieldName}.`);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`OpenRouter output has empty ${fieldName}.`);
  }

  if (normalized.length > maxLength) {
    return normalized.slice(0, maxLength);
  }

  return normalized;
}

function parseTone(value: unknown): Tone {
  if (typeof value !== "string") {
    throw new Error("OpenRouter output missing tone.");
  }

  const normalized = value.trim() as Tone;
  if (!toneValues.has(normalized)) {
    throw new Error("OpenRouter output has invalid tone.");
  }

  return normalized;
}

function extractJsonObject(text: string): string {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const genericFence = text.match(/```\s*([\s\S]*?)```/);
  if (genericFence?.[1]) {
    return genericFence[1].trim();
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("OpenRouter output did not include a JSON object.");
  }

  return text.slice(start, end + 1);
}

function parseAiPayload(rawContent: string): AiPayload {
  const jsonText = extractJsonObject(rawContent);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("OpenRouter output JSON was not parseable.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("OpenRouter output JSON was invalid.");
  }

  const obj = parsed as Record<string, unknown>;

  const aiPersonality =
    typeof obj.aiPersonality === "string" && obj.aiPersonality.trim()
      ? obj.aiPersonality.trim().slice(0, 160)
      : "Adaptive visitor";

  return {
    title: getString(obj.title, "title", 160),
    headline: getString(obj.headline, "headline", 220),
    body: getString(obj.body, "body", 8000),
    cta: getString(obj.cta, "cta", 120),
    tone: parseTone(obj.tone),
    aiPersonality,
  };
}

export async function personalizeWithOpenRouter(
  originalContent: OriginalContent,
  signals: BrowserSignals,
): Promise<OpenRouterPersonalization> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, OPENROUTER_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
          "HTTP-Referer": resolveHttpReferer(),
        "X-Title": "GhostLink",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              content: originalContent,
              signals,
            }),
          },
        ],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      const snippet = text.slice(0, 500);
      throw new Error(`OpenRouter request failed (${response.status}): ${snippet}`);
    }

    let payload: OpenRouterResponse;
    try {
      payload = JSON.parse(text) as OpenRouterResponse;
    } catch {
      throw new Error("OpenRouter response body was not valid JSON.");
    }

    const modelText = payload.choices?.[0]?.message?.content;
    if (!modelText || typeof modelText !== "string") {
      throw new Error("OpenRouter returned no message content.");
    }

    const aiPayload = parseAiPayload(modelText);

    return {
      content: {
        title: aiPayload.title,
        headline: aiPayload.headline,
        body: aiPayload.body,
        cta: aiPayload.cta || originalContent.cta || "Explore more",
        ctaUrl: originalContent.ctaUrl,
        tone: aiPayload.tone,
      },
      aiPersonality: aiPayload.aiPersonality,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new OpenRouterTimeoutError(
        "OpenRouter timed out after 10 seconds.",
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
