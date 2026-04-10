"use client";

import { useState } from "react";

import { showToast } from "@/lib/toast";

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (typeof document === "undefined") {
    return false;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "true");
  input.style.position = "absolute";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(input);
  return copied;
}

export default function CopyButton({
  text,
  className,
  label = "Copy link",
}: CopyButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const handleCopy = async (): Promise<void> => {
    try {
      const copied = await copyTextToClipboard(text);
      setStatus(copied ? "copied" : "failed");

      if (copied) {
        showToast({
          title: "Link copied",
          description: "URL copied to clipboard",
          kind: "success",
        });
      } else {
        showToast({
          title: "Copy failed",
          description: "Could not copy link",
          kind: "error",
        });
      }
    } catch {
      setStatus("failed");
      showToast({
        title: "Copy failed",
        description: "Could not copy link",
        kind: "error",
      });
    }

    window.setTimeout(() => {
      setStatus("idle");
    }, 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full border border-cyan-200/40 bg-cyan-200/12 px-5 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-50 transition hover:border-cyan-100/70 hover:bg-cyan-200/20"
      }
    >
      <i className={`bi ${status === "copied" ? "bi-check2" : status === "failed" ? "bi-exclamation-circle" : "bi-clipboard"}`} aria-hidden="true" />
      {status === "copied"
        ? "Copied"
        : status === "failed"
          ? "Copy failed"
          : label}
    </button>
  );
}
