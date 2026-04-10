"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function getDeviceSplit(devices: Record<string, number>): {
  mobileCount: number;
  laptopCount: number;
  mobilePercent: number;
  laptopPercent: number;
  totalCount: number;
} {
  const mobileCount = devices.mobile ?? 0;
  const laptopCount = (devices.tablet ?? 0) + (devices.desktop ?? 0);
  const totalCount = mobileCount + laptopCount;

  if (totalCount === 0) {
    return {
      mobileCount: 0,
      laptopCount: 0,
      mobilePercent: 0,
      laptopPercent: 0,
      totalCount: 0,
    };
  }

  const mobilePercent = Math.round((mobileCount / totalCount) * 100);

  return {
    mobileCount,
    laptopCount,
    mobilePercent,
    laptopPercent: 100 - mobilePercent,
    totalCount,
  };
}

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkSummary[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [expandedQrLink, setExpandedQrLink] = useState<LinkSummary | null>(null);
  const modalCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const modalTriggerRef = useRef<HTMLElement | null>(null);

  const closeExpandedQrModal = useCallback(() => {
    setExpandedQrLink(null);
  }, []);

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
    if (links.length === 0) {
      setAnalytics(null);
      return;
    }

    const controller = new AbortController();
    setIsLoadingAnalytics(true);

    const run = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/analytics`, {
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
  }, [links]);

  useEffect(() => {
    if (!expandedQrLink) {
      return;
    }

    modalTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalCloseButtonRef.current?.focus();

    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeExpandedQrModal();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const modal = modalContentRef.current;
      if (!modal) {
        return;
      }

      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstElement || !modal.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (activeElement === lastElement || !modal.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = previousBodyOverflow;
      modalTriggerRef.current?.focus();
    };
  }, [closeExpandedQrModal, expandedQrLink]);

  const referrerEntries = useMemo(() => {
    return formatCounterEntries(analytics?.referrers ?? {});
  }, [analytics?.referrers]);

  const deviceSplit = useMemo(() => {
    return getDeviceSplit(analytics?.devices ?? {});
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
                          onClick={(event) => {
                            modalTriggerRef.current = event.currentTarget;
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
              <h2 className="mt-3 text-3xl text-slate-50">All links overview</h2>
              <p className="mt-2 text-sm text-slate-200/70">
                Aggregated from every GhostLink in your workspace.
              </p>

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
                    <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">
                      Highest performing link
                    </p>
                    {analytics.highestPerformingLink ? (
                      <div className="mt-2 rounded-2xl border border-slate-200/20 bg-slate-950/35 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-lg text-slate-50">
                              {analytics.highestPerformingLink.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-200/70">
                              {analytics.highestPerformingLink.visits} views
                            </p>
                          </div>
                          <Link
                            href={analytics.highestPerformingLink.url}
                            className="rounded-full border border-cyan-100/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-50 transition hover:border-cyan-100/70 hover:bg-cyan-100/10"
                          >
                            Open
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-200/65">No link data yet.</p>
                    )}
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
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Devices</p>
                      {deviceSplit.totalCount > 0 ? (
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-200/60">
                          {deviceSplit.totalCount} total
                        </p>
                      ) : null}
                    </div>
                    {deviceSplit.totalCount > 0 ? (
                      <>
                        <div className="mt-3 flex items-center justify-between text-sm text-slate-100/85">
                          <span>Mobile {deviceSplit.mobilePercent}%</span>
                          <span>Laptop {deviceSplit.laptopPercent}%</span>
                        </div>
                        <div className="mt-3 h-3 overflow-hidden rounded-full border border-slate-200/15 bg-slate-950/50">
                          <div className="flex h-full w-full">
                            <div
                              className="h-full bg-[color:var(--accent-cyan)]"
                              style={{ width: `${deviceSplit.mobilePercent}%` }}
                            />
                            <div
                              className="h-full bg-[color:var(--accent-gold)]"
                              style={{ width: `${deviceSplit.laptopPercent}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-slate-200/65">
                          <span>{deviceSplit.mobileCount} mobile</span>
                          <span>{deviceSplit.laptopCount} laptop</span>
                        </div>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-slate-200/65">No device data yet.</p>
                    )}
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
          onClick={closeExpandedQrModal}
          role="dialog"
          aria-modal="true"
          aria-label={`Large QR code for ${expandedQrLink.title}`}
        >
          <div
            ref={modalContentRef}
            tabIndex={-1}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-cyan-100/35 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.2),rgba(2,6,23,0.92)_48%)] p-6 shadow-[0_18px_80px_rgba(15,23,42,0.65)]"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <button
              ref={modalCloseButtonRef}
              type="button"
              onClick={closeExpandedQrModal}
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
