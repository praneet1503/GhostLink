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
  const [source, setSource] = useState<ResolveResponse["source"] | null>(null);
  const [matchType, setMatchType] = useState<ResolveResponse["matchType"]>(undefined);

  const isValidSlugFormat = /^[a-z0-9-]{4,48}$/i.test(slug);

  const handleResolved = useCallback((response: ResolveResponse) => {
    setContent(response.content);
    setSource(response.source);
    setMatchType(response.matchType);
    setIsLoading(false);
  }, []);

  const handleSignals = useCallback((collectedSignals: BrowserSignals) => {
    setSignals(collectedSignals);
  }, []);

  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
    setIsLoading(false);
  }, []);

  const showNotFound =
    !isValidSlugFormat ||
    (errorMessage && /not found|unavailable|missing/i.test(errorMessage));

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-6 py-10 sm:px-8 lg:px-10">
      {isValidSlugFormat ? (
        <SignalCollector
          slug={slug}
          onResolved={handleResolved}
          onSignals={handleSignals}
          onError={handleError}
        />
      ) : null}

      <div className="mx-auto flex min-h-[80vh] w-full max-w-3xl flex-col justify-center">
        {isLoading ? (
          <section className="hero-panel reveal-up text-center">
            <p className="text-5xl motion-safe:animate-pulse" aria-hidden="true">
              👻
            </p>
            <h1 className="mt-4 text-4xl text-slate-50 sm:text-5xl">
              Loading your personalized page...
            </h1>
            <p className="mt-4 text-base text-slate-200/80">
              We are preparing the version most relevant to this visitor.
            </p>
            <p className="mt-2 text-sm text-slate-200/65">This usually takes a moment.</p>
              <div className="mx-auto mt-6 max-w-xl space-y-2">
                <div className="skeleton-block h-4 w-2/3" />
                <div className="skeleton-block h-4 w-full" />
                <div className="skeleton-block h-4 w-11/12" />
                <div className="skeleton-block h-4 w-5/6" />
              </div>
          </section>
        ) : null}

        {!isLoading && errorMessage ? (
          <section className="hero-panel reveal-up text-center">
            <h1 className="text-3xl text-slate-50 sm:text-4xl">
              {showNotFound ? "This link is unavailable" : "We could not load this page"}
            </h1>
            <p className="mt-4 text-base text-slate-200/80">
              {showNotFound
                ? "This link was not found or is no longer available."
                : errorMessage}
            </p>
            <div className="mt-7">
              <Link
                href="/"
                className="inline-flex rounded-full bg-[color:var(--accent-cyan)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Create a new GhostLink
              </Link>
            </div>
          </section>
        ) : null}

        {!isLoading && !errorMessage && content ? (
          <section className="reveal-up space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em]">
              <span className="rounded-full border border-slate-200/25 bg-slate-950/35 px-3 py-1 text-slate-200/75">
                Source: {source ?? "unknown"}
              </span>
              {source === "fallback" ? (
                <span className="rounded-full border border-amber-200/35 bg-amber-900/20 px-3 py-1 text-amber-100/90">
                    Showing the original message while personalization finishes
                </span>
              ) : null}
            </div>

            <ContentRenderer content={content} matchType={matchType} />

            {signals ? (
              <div className="rounded-2xl border border-slate-200/20 bg-slate-950/35 p-4 text-sm text-slate-200/75">
                <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">
                  Captured signals
                </p>
                <p className="mt-2">
                  {signals.deviceType} | {signals.timeOfDay} | {signals.referrer} |
                  {" "}
                  {signals.language}
                </p>
              </div>
            ) : null}

            <footer className="pt-2 text-center text-xs uppercase tracking-[0.16em] text-slate-200/55">
              Made with GhostLink
            </footer>
          </section>
        ) : null}
      </div>
    </main>
  );
}
