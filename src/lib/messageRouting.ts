import { hasOpenRouterApiKey, selectMessageIdWithOpenRouter } from "@/lib/openrouter";
import type {
  BrowserSignals,
  MessageCondition,
  MessageVariant,
  ResolveMatchType,
  ResolveResponse,
} from "@/types";

function normalizeString(value: string): string {
  return value.trim().toLowerCase();
}

function conditionMatches(signalValue: string, condition: MessageCondition): boolean {
  const normalizedSignal = normalizeString(signalValue);

  if (condition.operator === "equals") {
    if (typeof condition.value !== "string") {
      return false;
    }

    return normalizedSignal === normalizeString(condition.value);
  }

  if (condition.operator === "includes") {
    if (typeof condition.value !== "string") {
      return false;
    }

    return normalizedSignal.includes(normalizeString(condition.value));
  }

  if (!Array.isArray(condition.value)) {
    return false;
  }

  return condition.value.some((candidate) => {
    return normalizeString(candidate) === normalizedSignal;
  });
}

function messageMatchesSignals(signals: BrowserSignals, message: MessageVariant): boolean {
  if (message.conditions.length === 0) {
    return true;
  }

  return message.conditions.every((condition) => {
    const rawSignal = signals[condition.signal];
    if (rawSignal === undefined || rawSignal === null) {
      return false;
    }

    return conditionMatches(String(rawSignal), condition);
  });
}

export function matchMessageByRule(
  signals: BrowserSignals,
  messages: MessageVariant[],
): MessageVariant | null {
  const ordered = [...messages].sort((a, b) => a.priority - b.priority);

  for (const message of ordered) {
    if (messageMatchesSignals(signals, message)) {
      return message;
    }
  }

  return null;
}

function getDefaultMessage(messages: MessageVariant[], defaultMessageId?: string): MessageVariant {
  if (defaultMessageId) {
    const foundDefault = messages.find((message) => message.id === defaultMessageId);
    if (foundDefault) {
      return foundDefault;
    }
  }

  return [...messages].sort((a, b) => a.priority - b.priority)[0] ?? messages[0];
}

export async function selectMessageForSignals(
  signals: BrowserSignals,
  messages: MessageVariant[],
  defaultMessageId?: string,
): Promise<{
  message: MessageVariant;
  matchType: ResolveMatchType;
  source: ResolveResponse["source"];
  aiPersonality: string;
}> {
  const defaultMessage = getDefaultMessage(messages, defaultMessageId);
  const matched = matchMessageByRule(signals, messages);

  if (matched) {
    return {
      message: matched,
      matchType: "rule",
      source: "rule",
      aiPersonality: "Rule-based routing",
    };
  }

  if (hasOpenRouterApiKey()) {
    try {
      const selected = await selectMessageIdWithOpenRouter(
        signals,
        messages,
        defaultMessage.id,
      );

      const aiMessage =
        messages.find((message) => message.id === selected.messageId) ?? defaultMessage;

      return {
        message: aiMessage,
        matchType: "ai",
        source: "ai",
        aiPersonality: selected.aiPersonality,
      };
    } catch {
      return {
        message: defaultMessage,
        matchType: "default",
        source: "fallback",
        aiPersonality: "Default fallback (AI unavailable)",
      };
    }
  }

  return {
    message: defaultMessage,
    matchType: "default",
    source: "fallback",
    aiPersonality: "Default fallback",
  };
}
