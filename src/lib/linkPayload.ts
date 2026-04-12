import type {
  ConditionOperator,
  MessageCondition,
  MessageMode,
  MessageVariant,
  OriginalContent,
  SignalKey,
} from "@/types";

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 7000;
const MAX_CTA_LENGTH = 80;
const MAX_URL_LENGTH = 2000;

export type LinkPayloadInput = {
  messageMode?: unknown;
  title?: unknown;
  body?: unknown;
  cta?: unknown;
  ctaUrl?: unknown;
  imageUrl?: unknown;
  messages?: unknown;
  defaultMessageId?: unknown;
};

export type SanitizedLinkPayload = {
  messageMode: MessageMode;
  originalContent: OriginalContent;
  messages?: MessageVariant[];
  defaultMessageId?: string;
};

const SIGNAL_KEYS: SignalKey[] = [
  "timezone",
  "language",
  "deviceType",
  "screenSize",
  "timeOfDay",
  "dayOfWeek",
  "referrer",
  "colorScheme",
  "connectionSpeed",
  "mouseSpeed",
  "platform",
];
const CONDITION_OPERATORS: ConditionOperator[] = ["equals", "includes", "oneOf"];

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

function parseMessageConditions(value: unknown): MessageCondition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry): MessageCondition | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const raw = entry as Record<string, unknown>;
      const signal =
        typeof raw.signal === "string" && SIGNAL_KEYS.includes(raw.signal as SignalKey)
          ? (raw.signal as SignalKey)
          : null;
      const operator =
        typeof raw.operator === "string" &&
        CONDITION_OPERATORS.includes(raw.operator as ConditionOperator)
          ? (raw.operator as ConditionOperator)
          : null;

      if (!signal || !operator) {
        return null;
      }

      if (operator === "oneOf") {
        if (!Array.isArray(raw.value)) {
          return null;
        }

        const values = raw.value
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        if (values.length === 0) {
          return null;
        }

        return {
          signal,
          operator,
          value: values,
        };
      }

      if (typeof raw.value !== "string") {
        return null;
      }

      const normalized = raw.value.trim();
      if (!normalized) {
        return null;
      }

      return {
        signal,
        operator,
        value: normalized,
      };
    })
    .filter((entry): entry is MessageCondition => Boolean(entry));
}

function sanitizeMultiMessages(value: unknown): MessageVariant[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("At least one message is required in multi-message mode.");
  }

  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Message ${index + 1} is invalid.`);
    }

    const raw = entry as Record<string, unknown>;
    const title = sanitizeRequiredText(raw.title, MAX_TITLE_LENGTH, `Message ${index + 1} title`);
    const body = sanitizeRequiredText(raw.body, MAX_BODY_LENGTH, `Message ${index + 1} body`);
    const cta = sanitizeOptionalText(raw.cta, MAX_CTA_LENGTH);
    const ctaUrl = sanitizeOptionalText(raw.ctaUrl, MAX_URL_LENGTH);

    if (ctaUrl && !isValidHttpUrl(ctaUrl)) {
      throw new Error(`Message ${index + 1} CTA URL must start with http:// or https://.`);
    }

    const id =
      typeof raw.id === "string" && raw.id.trim().length > 0
        ? raw.id.trim()
        : `message-${index + 1}`;
    const priority =
      typeof raw.priority === "number" && Number.isFinite(raw.priority)
        ? Math.max(1, Math.floor(raw.priority))
        : index + 1;

    return {
      id,
      content: {
        title,
        body,
        ...(cta ? { cta } : {}),
        ...(ctaUrl ? { ctaUrl } : {}),
      },
      conditions: parseMessageConditions(raw.conditions),
      priority,
      createdAt: new Date().toISOString(),
    };
  });
}

export function sanitizeLinkPayload(payload: LinkPayloadInput): SanitizedLinkPayload {
  const messageMode: MessageMode = payload.messageMode === "multi" ? "multi" : "single";

  if (messageMode === "multi") {
    const messages = sanitizeMultiMessages(payload.messages);
    const candidateDefaultId =
      typeof payload.defaultMessageId === "string"
        ? payload.defaultMessageId.trim()
        : "";
    const defaultMessageId =
      candidateDefaultId && messages.some((message) => message.id === candidateDefaultId)
        ? candidateDefaultId
        : messages[0].id;
    const defaultMessage =
      messages.find((message) => message.id === defaultMessageId) ?? messages[0];

    return {
      messageMode,
      originalContent: defaultMessage.content,
      messages,
      defaultMessageId,
    };
  }

  const title = sanitizeRequiredText(payload.title, MAX_TITLE_LENGTH, "Title");
  const body = sanitizeRequiredText(payload.body, MAX_BODY_LENGTH, "Body");
  const cta = sanitizeOptionalText(payload.cta, MAX_CTA_LENGTH);
  const ctaUrl = sanitizeOptionalText(payload.ctaUrl, MAX_URL_LENGTH);

  if (ctaUrl && !isValidHttpUrl(ctaUrl)) {
    throw new Error("Call to action URL must start with http:// or https://.");
  }

  return {
    messageMode,
    originalContent: {
      title,
      body,
      ...(cta ? { cta } : {}),
      ...(ctaUrl ? { ctaUrl } : {}),
    },
  };
}
