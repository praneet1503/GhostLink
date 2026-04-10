import type { ConditionOperator, SignalKey } from "@/types";

export type RuleSignalKey = Exclude<SignalKey, "timezone" | "language">;

export interface RuleValueOption {
  value: string;
  label: string;
}

export type RuleValueMode = "select" | "time";

interface RuleSignalConfig {
  label: string;
  operators: ConditionOperator[];
  valueMode: RuleValueMode;
  valueOptions?: RuleValueOption[];
}

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const RULE_SIGNAL_CONFIG: Record<RuleSignalKey, RuleSignalConfig> = {
  referrer: {
    label: "Referrer",
    operators: ["equals", "oneOf"],
    valueMode: "select",
    valueOptions: [
      { value: "linkedin", label: "LinkedIn" },
      { value: "whatsapp", label: "WhatsApp" },
      { value: "twitter", label: "Twitter/X" },
      { value: "github", label: "GitHub" },
      { value: "direct", label: "Direct" },
      { value: "other", label: "Other" },
    ],
  },
  deviceType: {
    label: "Device type",
    operators: ["equals", "oneOf"],
    valueMode: "select",
    valueOptions: [
      { value: "mobile", label: "Mobile" },
      { value: "tablet", label: "Tablet" },
      { value: "desktop", label: "Desktop" },
    ],
  },
  screenSize: {
    label: "Screen size",
    operators: ["equals", "oneOf"],
    valueMode: "select",
    valueOptions: [
      { value: "small", label: "Small" },
      { value: "medium", label: "Medium" },
      { value: "large", label: "Large" },
    ],
  },
  platform: {
    label: "Platform",
    operators: ["equals", "oneOf"],
    valueMode: "select",
    valueOptions: [
      { value: "windows", label: "Windows" },
      { value: "mac", label: "Mac" },
      { value: "linux", label: "Linux" },
      { value: "ios", label: "iOS" },
      { value: "android", label: "Android" },
      { value: "other", label: "Other" },
    ],
  },
  timeOfDay: {
    label: "Time of day",
    operators: ["equals"],
    valueMode: "time",
  },
  dayOfWeek: {
    label: "Day of week",
    operators: ["equals", "oneOf"],
    valueMode: "select",
    valueOptions: [
      { value: "weekday", label: "Weekday" },
      { value: "weekend", label: "Weekend" },
    ],
  },
  connectionSpeed: {
    label: "Connection speed",
    operators: ["equals", "oneOf"],
    valueMode: "select",
    valueOptions: [
      { value: "slow", label: "Slow" },
      { value: "fast", label: "Fast" },
      { value: "unknown", label: "Unknown" },
    ],
  },
  mouseSpeed: {
    label: "Mouse speed",
    operators: ["equals", "oneOf"],
    valueMode: "select",
    valueOptions: [
      { value: "slow", label: "Slow" },
      { value: "fast", label: "Fast" },
      { value: "not_available", label: "Not available" },
    ],
  },
  colorScheme: {
    label: "Color scheme",
    operators: ["equals", "oneOf"],
    valueMode: "select",
    valueOptions: [
      { value: "dark", label: "Dark" },
      { value: "light", label: "Light" },
    ],
  },
};

export const RULE_SIGNAL_KEYS = Object.keys(RULE_SIGNAL_CONFIG) as RuleSignalKey[];

export const RULE_SIGNAL_OPTIONS = RULE_SIGNAL_KEYS.map((signal) => {
  return {
    value: signal,
    label: RULE_SIGNAL_CONFIG[signal].label,
  };
});

export function isRuleSignalKey(signal: string): signal is RuleSignalKey {
  return signal in RULE_SIGNAL_CONFIG;
}

export function getRuleSignalConfig(signal: SignalKey): RuleSignalConfig | null {
  if (!isRuleSignalKey(signal)) {
    return null;
  }

  return RULE_SIGNAL_CONFIG[signal];
}

export function getDefaultRuleSignal(): RuleSignalKey {
  return RULE_SIGNAL_KEYS[0];
}

export function normalizeOperatorForSignal(
  signal: RuleSignalKey,
  operator: ConditionOperator,
): ConditionOperator {
  const allowed = RULE_SIGNAL_CONFIG[signal].operators;
  return allowed.includes(operator) ? operator : allowed[0];
}

export function parseConditionValueList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function stringifyConditionValueList(values: string[]): string {
  return values.join(", ");
}

export function getDefaultValueForSignal(signal: RuleSignalKey): string {
  const config = RULE_SIGNAL_CONFIG[signal];
  if (config.valueMode === "time") {
    return "09:00";
  }

  return config.valueOptions?.[0]?.value ?? "";
}

export function isAllowedOperatorForSignal(
  signal: SignalKey,
  operator: ConditionOperator,
): boolean {
  const config = getRuleSignalConfig(signal);
  if (!config) {
    return false;
  }

  return config.operators.includes(operator);
}

export function isAllowedValueForSignal(signal: SignalKey, value: string): boolean {
  const config = getRuleSignalConfig(signal);
  if (!config) {
    return false;
  }

  if (config.valueMode === "time") {
    return ["morning", "afternoon", "evening", "night"].includes(value);
  }

  return (config.valueOptions ?? []).some((option) => option.value === value);
}

export function isTimeInputSignal(signal: SignalKey): boolean {
  const config = getRuleSignalConfig(signal);
  return config?.valueMode === "time";
}

export function isValidTimeInput(value: string): boolean {
  return TIME_24H_REGEX.test(value.trim());
}

function mapHourToTimeOfDay(hour: number): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 22) {
    return "evening";
  }

  return "night";
}

export function normalizeTimeConditionValue(signal: SignalKey, value: string): string | null {
  if (!isTimeInputSignal(signal)) {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (["morning", "afternoon", "evening", "night"].includes(normalized)) {
    return normalized;
  }

  if (!isValidTimeInput(normalized)) {
    return null;
  }

  const [hourText] = normalized.split(":");
  const hour = Number.parseInt(hourText, 10);
  if (!Number.isFinite(hour)) {
    return null;
  }

  return mapHourToTimeOfDay(hour);
}
