"use client";

import { useEffect } from "react";

import { collectBrowserSignals } from "@/lib/signals";
import type { BrowserSignals, ResolveResponse } from "@/types";

interface SignalCollectorProps {
  slug: string;
  onResolved: (response: ResolveResponse) => void;
  onSignals: (signals: BrowserSignals) => void;
  onError: (message: string) => void;
}

type ResolveApiResponse = Partial<ResolveResponse> & {
  error?: string;
};

export default function SignalCollector({
  slug,
  onResolved,
  onSignals,
  onError,
}: SignalCollectorProps) {
  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const run = async (): Promise<void> => {
      try {
        const signals = await collectBrowserSignals();
        if (!isActive) {
          return;
        }

        onSignals(signals);

        const response = await fetch("/api/resolve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slug, signals }),
          signal: controller.signal,
        });

        const payload = (await response.json()) as ResolveApiResponse;
        if (!response.ok || !payload.content || !payload.source) {
          throw new Error(payload.error ?? "Unable to personalize this GhostLink.");
        }

        if (!isActive) {
          return;
        }

        onResolved({
          content: payload.content,
          source: payload.source,
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        onError(
          error instanceof Error
            ? error.message
            : "Unable to personalize this GhostLink.",
        );
      }
    };

    void run();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [onError, onResolved, onSignals, slug]);

  return null;
}
