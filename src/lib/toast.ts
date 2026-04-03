export type ToastKind = "success" | "error" | "info";

export interface ToastInput {
  title: string;
  description?: string;
  kind?: ToastKind;
  durationMs?: number;
}

export const TOAST_EVENT_NAME = "ghostlink:toast";

export function showToast(input: ToastInput): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<ToastInput>(TOAST_EVENT_NAME, {
    detail: input,
  }));
}
