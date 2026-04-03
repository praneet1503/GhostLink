"use client";

import { useEffect, useMemo, useState } from "react";

import { TOAST_EVENT_NAME, type ToastInput, type ToastKind } from "@/lib/toast";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  kind: ToastKind;
}

function kindClass(kind: ToastKind): string {
  if (kind === "success") {
    return "border-emerald-200/45 bg-emerald-900/30 text-emerald-50";
  }

  if (kind === "error") {
    return "border-rose-200/45 bg-rose-900/30 text-rose-50";
  }

  return "border-cyan-200/45 bg-cyan-900/30 text-cyan-50";
}

export default function ToastViewport() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (event: Event): void => {
      const customEvent = event as CustomEvent<ToastInput>;
      const detail = customEvent.detail;
      if (!detail?.title) {
        return;
      }

      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const item: ToastItem = {
        id,
        title: detail.title,
        description: detail.description,
        kind: detail.kind ?? "info",
      };

      setToasts((current) => [item, ...current].slice(0, 4));

      const duration = Math.max(1200, detail.durationMs ?? 2200);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, duration);
    };

    window.addEventListener(TOAST_EVENT_NAME, onToast as EventListener);

    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, onToast as EventListener);
    };
  }, []);

  const hasToasts = useMemo(() => toasts.length > 0, [toasts.length]);

  return (
    <div
      className={`pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(24rem,92vw)] flex-col gap-2 transition-opacity duration-300 ${
        hasToasts ? "opacity-100" : "opacity-0"
      }`}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-in pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-[0_16px_32px_rgba(3,8,20,0.45)] ${kindClass(toast.kind)}`}
        >
          <p className="font-semibold uppercase tracking-[0.12em]">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-100/85">
              {toast.description}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
