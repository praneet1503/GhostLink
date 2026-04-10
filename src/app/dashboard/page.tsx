"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import CopyButton from "@/components/CopyButton";
import type { AnalyticsResponse, LinkSummary, LinksResponse } from "@/types";

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function formatCounterEntries(counter: Record<string, number>): Array<[string, number]> {
  return Object.entries(counter).sort((a, b) => b[1] - a[1]);
}

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkSummary[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [expandedQrLink, setExpandedQrLink] = useState<LinkSummary | null>(null);

  const selectedLink = useMemo(() => {
    if (!selectedSlug) {
      return null;
    }

    return links.find((link) => link.id === selectedSlug) ?? null;
  }, [links, selectedSlug]);

  const fetchLinks = useCallback(async (): Promise<void> => {
    setIsLoadingLinks(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/links?limit=100", { cache: "no-store" });
      const payload = (await response.json()) as Partial<LinksResponse> & {
        error?: string;
      };

      if (!response.ok || !payload.links) {
        throw new Error(payload.error ?? "Failed to fetch links.");
      }

      const fetchedLinks = payload.links;

      setLinks(fetchedLinks);
      setSelectedSlug((current) => {
        if (current && fetchedLinks.some((link) => link.id === current)) {
          return current;
        }

        return fetchedLinks[0]?.id ?? null;
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to fetch links.");
      setLinks([]);
      setSelectedSlug(null);
    } finally {
      setIsLoadingLinks(false);
    }
  }, []);

  useEffect(() => {
    void fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    if (!selectedSlug) {
      setAnalytics(null);
      return;
    }

    const controller = new AbortController();
    setIsLoadingAnalytics(true);

    const run = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/analytics?slug=${selectedSlug}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as Partial<AnalyticsResponse> & {
          error?: string;
        };

        if (!response.ok || !payload.slug) {
          throw new Error(payload.error ?? "Failed to fetch analytics.");
        }

        setAnalytics(payload as AnalyticsResponse);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAnalytics(null);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [selectedSlug]);

  useEffect(() => {
    if (!expandedQrLink) {
      return;
    }

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setExpandedQrLink(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [expandedQrLink]);

  const toneEntries = useMemo(() => {
    return formatCounterEntries(analytics?.tones ?? {});
  }, [analytics?.tones]);

  const referrerEntries = useMemo(() => {
    return formatCounterEntries(analytics?.referrers ?? {});
  }, [analytics?.referrers]);

  const deviceEntries = useMemo(() => {
    return formatCounterEntries(analytics?.devices ?? {});
  }, [analytics?.devices]);

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-6 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            
            <h1 className="mt-2 text-4xl text-slate-50 sm:text-5xl">Your GhostLinks</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-slate-300/30 px-5 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-100 transition hover:border-slate-100/60 hover:bg-slate-100/10"
            >
              Home
            </Link>
            <Link
              href="/create"
              className="rounded-full bg-[color:var(--accent-cyan)] px-5 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:-translate-y-0.5 hover:brightness-110"
            >
              New link
            </Link>
          </div>
        </header>

        {errorMessage ? (
          <section className="rounded-2xl border border-rose-300/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-100">
            {errorMessage}
          </section>
        ) : null}

        {isLoadingLinks ? (
          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <article className="rounded-3xl border border-slate-200/20 bg-slate-950/35 p-5">
                <div className="skeleton-block h-6 w-48" />
                <div className="mt-3 skeleton-block h-4 w-64" />
                <div className="mt-4 skeleton-block h-4 w-full" />
                <div className="mt-2 skeleton-block h-4 w-5/6" />
              </article>
              <article className="rounded-3xl border border-slate-200/20 bg-slate-950/35 p-5">
                <div className="skeleton-block h-6 w-56" />
                <div className="mt-3 skeleton-block h-4 w-72" />
                <div className="mt-4 skeleton-block h-4 w-full" />
                <div className="mt-2 skeleton-block h-4 w-4/6" />
              </article>
            </div>
            <aside className="hero-panel h-fit">
              <div className="skeleton-block h-5 w-36" />
              <div className="mt-3 skeleton-block h-8 w-3/4" />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="skeleton-block h-16 w-full" />
                <div className="skeleton-block h-16 w-full" />
              </div>
            </aside>
          </section>
        ) : null}

        {!isLoadingLinks && links.length === 0 ? (
          <section className="hero-panel">
            <h2 className="text-3xl text-slate-50">No links yet</h2>
            <p className="mt-3 text-base text-slate-200/80">
              Create your first GhostLink to start collecting adaptive delivery analytics.
            </p>
            <div className="mt-6">
              <Link
                href="/create"
                className="inline-flex rounded-full bg-[color:var(--accent-cyan)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Create now
              </Link>
            </div>
          </section>
        ) : null}

        {!isLoadingLinks && links.length > 0 ? (
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              {links.map((link) => {
                const isActive = selectedSlug === link.id;

                return (
                  <article
                    key={link.id}
                    className={`rounded-3xl border p-5 transition ${
                      isActive
                        ? "border-cyan-200/60 bg-cyan-900/10"
                        : "border-slate-200/20 bg-slate-950/35"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl text-slate-50">{link.title}</h3>
                        <p className="mt-1 text-sm text-slate-200/70">
                          Created {formatTimestamp(link.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="rounded-full border border-cyan-100/30 px-3 py-1 text-xs uppercase tracking-[0.14em] text-cyan-100/80">
                          {link.visits} visits
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedQrLink(link);
                          }}
                          className="group relative rounded-lg border border-slate-300/20 bg-slate-950/45 p-1 transition hover:-translate-y-0.5 hover:border-cyan-100/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
                          aria-label={`Open larger QR code for ${link.title}`}
                        >
                          <QRCodeSVG
                            value={link.url}
                            size={56}
                            bgColor="transparent"
                            fgColor="#ecf3ff"
                            level="M"
                          />
                          <span className="pointer-events-none absolute inset-0 rounded-lg bg-cyan-200/0 transition group-hover:bg-cyan-200/5" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 break-all text-sm text-slate-100/85">{link.url}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <CopyButton text={link.url} />
                      <Link
                        href={`/g/${link.id}`}
                        className="rounded-full border border-slate-300/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-100 transition hover:border-slate-100/60 hover:bg-slate-100/10"
                      >
                        Open
                      </Link>
                    </div>

                    {link.recentSignals.length > 0 ? (
                      <div className="mt-4 rounded-2xl border border-slate-200/15 bg-slate-950/40 p-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">
                          Last 5 visitor snapshots
                        </p>
                        <div className="mt-3 space-y-2 text-sm text-slate-200/80">
                          {link.recentSignals.map((log) => (
                            <p key={`${log.timestamp}-${log.aiPersonality}`}>
                              {log.aiPersonality} | {log.toneServed} | {log.signals.referrer} | {formatTimestamp(log.timestamp)}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <aside className="hero-panel h-fit">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/72">
                Analytics detail
              </p>
              {selectedLink ? (
                <h2 className="mt-3 text-3xl text-slate-50">{selectedLink.title}</h2>
              ) : (
                <h2 className="mt-3 text-3xl text-slate-50">Select a link</h2>
              )}

              {isLoadingAnalytics ? (
                <div className="mt-4 space-y-2">
                  <div className="skeleton-block h-4 w-40" />
                  <div className="skeleton-block h-4 w-full" />
                  <div className="skeleton-block h-4 w-10/12" />
                </div>
              ) : null}

              {!isLoadingAnalytics && analytics ? (
                <div className="mt-5 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200/20 bg-slate-950/35 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Visits</p>
                      <p className="mt-1 text-2xl text-slate-50">{analytics.visits}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/20 bg-slate-950/35 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Recent logs</p>
                      <p className="mt-1 text-2xl text-slate-50">{analytics.recentSignals.length}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Tone distribution</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {toneEntries.length > 0 ? (
                        toneEntries.map(([label, count]) => (
                          <span key={label} className="rounded-full border border-slate-200/25 px-3 py-1 text-xs uppercase tracking-[0.1em] text-slate-100/90">
                            {label}: {count}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-200/65">No tone data yet.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Top referrers</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {referrerEntries.length > 0 ? (
                        referrerEntries.map(([label, count]) => (
                          <span key={label} className="rounded-full border border-slate-200/25 px-3 py-1 text-xs uppercase tracking-[0.1em] text-slate-100/90">
                            {label}: {count}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-200/65">No referrer data yet.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Devices</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {deviceEntries.length > 0 ? (
                        deviceEntries.map(([label, count]) => (
                          <span key={label} className="rounded-full border border-slate-200/25 px-3 py-1 text-xs uppercase tracking-[0.1em] text-slate-100/90">
                            {label}: {count}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-200/65">No device data yet.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </aside>
          </section>
        ) : null}
      </div>

      {expandedQrLink ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/82 px-4 backdrop-blur-md"
          onClick={() => {
            setExpandedQrLink(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Large QR code for ${expandedQrLink.title}`}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-100/35 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.2),rgba(2,6,23,0.92)_48%)] p-6 shadow-[0_18px_80px_rgba(15,23,42,0.65)]"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <button
              type="button"
              onClick={() => {
                setExpandedQrLink(null);
              }}
              className="absolute right-4 top-4 rounded-full border border-slate-200/35 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-100 transition hover:border-cyan-100/70 hover:bg-cyan-100/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
            >
              Close
            </button>

            <p className="pr-20 text-xs uppercase tracking-[0.14em] text-cyan-100/75">Scan link</p>
            <h3 className="mt-2 text-2xl text-slate-50">{expandedQrLink.title}</h3>

            <div className="mt-5 rounded-2xl border border-slate-200/25 bg-slate-950/45 p-5">
              <div className="mx-auto w-fit rounded-xl border border-slate-200/35 bg-white p-4 shadow-[0_0_30px_rgba(125,211,252,0.3)]">
                <QRCodeSVG
                  value={expandedQrLink.url}
                  size={260}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="H"
                  includeMargin
                />
              </div>
            </div>

            <p className="mt-4 break-all text-sm text-slate-100/90">{expandedQrLink.url}</p>
            <p className="mt-2 text-xs text-slate-200/70">Tip: press Esc or tap outside to close.</p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
