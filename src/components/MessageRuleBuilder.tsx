"use client";

import type { ConditionOperator, SignalKey } from "@/types";

export interface DraftCondition {
  id: string;
  signal: SignalKey;
  operator: ConditionOperator;
  value: string;
}

export interface DraftMessage {
  id: string;
  title: string;
  body: string;
  cta: string;
  ctaUrl: string;
  conditions: DraftCondition[];
}

interface MessageRuleBuilderProps {
  messages: DraftMessage[];
  defaultMessageId: string;
  onAddMessage: () => void;
  onRemoveMessage: (messageId: string) => void;
  onMoveMessage: (messageId: string, direction: "up" | "down") => void;
  onSetDefaultMessage: (messageId: string) => void;
  onUpdateMessage: (messageId: string, patch: Partial<DraftMessage>) => void;
  onAddCondition: (messageId: string) => void;
  onUpdateCondition: (
    messageId: string,
    conditionId: string,
    patch: Partial<DraftCondition>,
  ) => void;
  onRemoveCondition: (messageId: string, conditionId: string) => void;
}

const SIGNAL_OPTIONS: Array<{ value: SignalKey; label: string }> = [
  { value: "referrer", label: "Referrer" },
  { value: "deviceType", label: "Device type" },
  { value: "screenSize", label: "Screen size" },
  { value: "platform", label: "Platform" },
  { value: "timeOfDay", label: "Time of day" },
  { value: "dayOfWeek", label: "Day of week" },
  { value: "timezone", label: "Timezone" },
  { value: "language", label: "Language" },
  { value: "connectionSpeed", label: "Connection speed" },
  { value: "mouseSpeed", label: "Mouse speed" },
  { value: "colorScheme", label: "Color scheme" },
];

const OPERATOR_OPTIONS: Array<{ value: ConditionOperator; label: string }> = [
  { value: "equals", label: "equals" },
  { value: "includes", label: "includes" },
  { value: "oneOf", label: "one of (comma-separated)" },
];

export default function MessageRuleBuilder({
  messages,
  defaultMessageId,
  onAddMessage,
  onRemoveMessage,
  onMoveMessage,
  onSetDefaultMessage,
  onUpdateMessage,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
}: MessageRuleBuilderProps) {
  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm uppercase tracking-[0.12em] text-cyan-100/75">
          Multi-message routing rules
        </p>
        <button
          type="button"
          onClick={onAddMessage}
          className="rounded-full border border-cyan-100/35 bg-cyan-900/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-50 transition hover:border-cyan-100/65"
        >
          Add message
        </button>
      </div>

      {messages.map((message, index) => {
        const isDefault = defaultMessageId === message.id;

        return (
          <article
            key={message.id}
            className="rounded-2xl border border-slate-300/25 bg-slate-950/35 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.12em] text-cyan-100/70">
                Priority {index + 1}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onMoveMessage(message.id, "up")}
                  disabled={index === 0}
                  className="rounded-full border border-slate-200/25 px-3 py-1 text-xs uppercase tracking-[0.12em] text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => onMoveMessage(message.id, "down")}
                  disabled={index === messages.length - 1}
                  className="rounded-full border border-slate-200/25 px-3 py-1 text-xs uppercase tracking-[0.12em] text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => onSetDefaultMessage(message.id)}
                  className="rounded-full border border-emerald-200/30 bg-emerald-900/20 px-3 py-1 text-xs uppercase tracking-[0.12em] text-emerald-100"
                >
                  {isDefault ? "Default" : "Set default"}
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveMessage(message.id)}
                  disabled={messages.length === 1}
                  className="rounded-full border border-rose-300/35 px-3 py-1 text-xs uppercase tracking-[0.12em] text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.12em] text-cyan-100/70">
                  Message title
                </span>
                <input
                  value={message.title}
                  onChange={(event) =>
                    onUpdateMessage(message.id, { title: event.target.value })
                  }
                  type="text"
                  maxLength={120}
                  required
                  className="rounded-xl border border-slate-300/25 bg-slate-900/55 px-3 py-2 text-slate-50 outline-none focus:border-cyan-200/70"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs uppercase tracking-[0.12em] text-cyan-100/70">
                  Message body
                </span>
                <textarea
                  value={message.body}
                  onChange={(event) =>
                    onUpdateMessage(message.id, { body: event.target.value })
                  }
                  rows={5}
                  maxLength={7000}
                  required
                  className="rounded-xl border border-slate-300/25 bg-slate-900/55 px-3 py-2 text-slate-50 outline-none focus:border-cyan-200/70"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.12em] text-cyan-100/70">
                    CTA text (optional)
                  </span>
                  <input
                    value={message.cta}
                    onChange={(event) =>
                      onUpdateMessage(message.id, { cta: event.target.value })
                    }
                    type="text"
                    maxLength={80}
                    className="rounded-xl border border-slate-300/25 bg-slate-900/55 px-3 py-2 text-slate-50 outline-none focus:border-cyan-200/70"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs uppercase tracking-[0.12em] text-cyan-100/70">
                    CTA URL (optional)
                  </span>
                  <input
                    value={message.ctaUrl}
                    onChange={(event) =>
                      onUpdateMessage(message.id, { ctaUrl: event.target.value })
                    }
                    type="url"
                    className="rounded-xl border border-slate-300/25 bg-slate-900/55 px-3 py-2 text-slate-50 outline-none focus:border-cyan-200/70"
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200/20 bg-slate-950/45 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-100/70">
                  Rule conditions (all must match)
                </p>
                <button
                  type="button"
                  onClick={() => onAddCondition(message.id)}
                  className="rounded-full border border-cyan-100/30 px-3 py-1 text-xs uppercase tracking-[0.12em] text-cyan-50"
                >
                  Add condition
                </button>
              </div>

              {message.conditions.length === 0 ? (
                <p className="mt-2 text-xs text-slate-300/70">
                  No conditions set. This message can act as a catch-all if earlier rules do not match.
                </p>
              ) : null}

              <div className="mt-3 grid gap-3">
                {message.conditions.map((condition) => {
                  return (
                    <div
                      key={condition.id}
                      className="grid gap-3 rounded-lg border border-slate-200/15 bg-slate-900/45 p-3 md:grid-cols-[1fr_1fr_2fr_auto]"
                    >
                      <select
                        value={condition.signal}
                        onChange={(event) =>
                          onUpdateCondition(message.id, condition.id, {
                            signal: event.target.value as SignalKey,
                          })
                        }
                        className="rounded-lg border border-slate-300/25 bg-slate-900/75 px-2 py-2 text-sm text-slate-50 outline-none focus:border-cyan-200/70"
                      >
                        {SIGNAL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={condition.operator}
                        onChange={(event) =>
                          onUpdateCondition(message.id, condition.id, {
                            operator: event.target.value as ConditionOperator,
                          })
                        }
                        className="rounded-lg border border-slate-300/25 bg-slate-900/75 px-2 py-2 text-sm text-slate-50 outline-none focus:border-cyan-200/70"
                      >
                        {OPERATOR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <input
                        value={condition.value}
                        onChange={(event) =>
                          onUpdateCondition(message.id, condition.id, {
                            value: event.target.value,
                          })
                        }
                        type="text"
                        placeholder={
                          condition.operator === "oneOf"
                            ? "mobile, tablet"
                            : "linkedin"
                        }
                        className="rounded-lg border border-slate-300/25 bg-slate-900/75 px-3 py-2 text-sm text-slate-50 outline-none focus:border-cyan-200/70"
                      />

                      <button
                        type="button"
                        onClick={() => onRemoveCondition(message.id, condition.id)}
                        className="rounded-lg border border-rose-300/40 px-3 py-2 text-xs uppercase tracking-[0.1em] text-rose-100"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
