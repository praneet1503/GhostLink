"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import ContentRenderer from "@/components/ContentRenderer";
import SignalCollector from "@/components/SignalCollector";
import type { BrowserSignals, PersonalizedContent, ResolveResponse } from "@/types";

interface GhostLinkExperienceProps {
  slug: string;
}

export default function GhostLinkExperience({ slug }: GhostLinkExperienceProps) {
  const [content, setContent] = useState<PersonalizedContent | null>(null);
  const [signals, setSignals] = useState<BrowserSignals | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleResolved = useCallback((response: ResolveResponse) => {
    setContent(response.content);
    setIsLoading(false);
  }, []);

  const handleSignals = useCallback((collectedSignals: BrowserSignals) => {
    setSignals(collectedSignals);
  }, []);

  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
    setIsLoading(false);
  }, []);

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-6 py-10 sm:px-8 lg:px-10">
      <SignalCollector
        slug={slug}
        onResolved={handleResolved}
        onSignals={handleSignals}
        onError={handleError}
      />

      <div className="mx-auto flex min-h-[80vh] w-full max-w-3xl flex-col justify-center">
        {isLoading ? (
          <section className="hero-panel text-center">
            <p className="text-5xl motion-safe:animate-pulse" aria-hidden="true">
              👻
            </p>
            <h1 className="mt-4 text-4xl text-slate-50 sm:text-5xl">
              Preparing your experience...
            </h1>
            <p className="mt-4 text-base text-slate-200/80">Reading the room...</p>
          </section>
        ) : null}

        {!isLoading && errorMessage ? (
          <section className="hero-panel text-center">
            <h1 className="text-3xl text-slate-50 sm:text-4xl">Link unavailable</h1>
            <p className="mt-4 text-base text-slate-200/80">{errorMessage}</p>
            <div className="mt-7">
              <Link
                href="/"
                className="inline-flex rounded-full bg-[color:var(--accent-cyan)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Back to home
              </Link>
            </div>
          </section>
        ) : null}

        {!isLoading && !errorMessage && content ? (
          <section className="space-y-5">
            <ContentRenderer content={content} />
            {signals ? (
              <div className="rounded-2xl border border-slate-200/20 bg-slate-950/35 p-4 text-sm text-slate-200/75">
                <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">
                  Signals captured
                </p>
                <p className="mt-2">
                  {signals.deviceType} | {signals.timeOfDay} | {signals.referrer} |
                  {" "}
                  {signals.language}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
