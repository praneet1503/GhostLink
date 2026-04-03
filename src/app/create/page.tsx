"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import CopyButton from "@/components/CopyButton";
import { showToast } from "@/lib/toast";
import type { CreateLinkResponse } from "@/types";

interface CreateFormState {
  title: string;
  body: string;
  cta: string;
  ctaUrl: string;
}

type CreateApiResponse = Partial<CreateLinkResponse> & {
  error?: string;
};

export default function CreatePage() {
  const [form, setForm] = useState<CreateFormState>({
    title: "",
    body: "",
    cta: "",
    ctaUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<CreateLinkResponse | null>(null);

  const canSubmit = useMemo(() => {
    return form.title.trim().length > 0 && form.body.trim().length > 0;
  }, [form.body, form.title]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      cta: form.cta.trim() || undefined,
      ctaUrl: form.ctaUrl.trim() || undefined,
    };

    try {
      const response = await fetch("/api/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as CreateApiResponse;
      if (!response.ok || !data.slug || !data.url) {
        throw new Error(data.error ?? "Could not create your GhostLink.");
      }

      setCreatedLink({ slug: data.slug, url: data.url });
      showToast({
        title: "GhostLink created",
        description: "Your adaptive URL is ready",
        kind: "success",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not create your GhostLink.",
      );
      showToast({
        title: "Create failed",
        description: "Please check your fields and retry",
        kind: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdLink) {
    return (
      <main className="relative isolate min-h-screen overflow-hidden px-6 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200/20 bg-slate-950/45 p-8 shadow-[0_24px_60px_rgba(3,8,20,0.4)] sm:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">
            Phase 2 complete
          </p>
          <h1 className="mt-4 text-4xl text-slate-50 sm:text-5xl">
            Your GhostLink is live.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-200/80">
            Share this one URL and every visitor gets a context-aware experience.
          </p>

          <div className="mt-7 rounded-2xl border border-cyan-100/20 bg-slate-900/45 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">
              Generated link
            </p>
            <p className="mt-2 break-all text-base text-slate-100">{createdLink.url}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CopyButton text={createdLink.url} />
              <Link
                href={`/g/${createdLink.slug}`}
                className="rounded-full border border-slate-300/30 px-5 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-100 transition hover:border-slate-100/60 hover:bg-slate-100/10"
              >
                Open preview
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-slate-300/30 px-5 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-100 transition hover:border-slate-100/60 hover:bg-slate-100/10"
              >
                Open dashboard
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-start gap-6">
            <div className="rounded-2xl border border-slate-300/25 bg-slate-950/40 p-4">
              <QRCodeSVG
                value={createdLink.url}
                size={190}
                bgColor="transparent"
                fgColor="#ecf3ff"
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="max-w-sm">
              <p className="text-sm leading-relaxed text-slate-200/80">
                Scan this QR code from another device to demo how the exact same
                GhostLink can adapt its delivery style.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCreatedLink(null);
                  setForm({ title: "", body: "", cta: "", ctaUrl: "" });
                }}
                className="mt-4 rounded-full border border-cyan-200/40 bg-cyan-200/12 px-5 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-50 transition hover:border-cyan-100/70 hover:bg-cyan-200/20"
              >
                Create another link
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden px-6 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200/20 bg-slate-950/45 p-8 shadow-[0_24px_60px_rgba(3,8,20,0.4)] sm:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">
          Create your GhostLink
        </p>
        <h1 className="mt-4 text-4xl text-slate-50 sm:text-5xl">
          One input. Infinite variations.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200/80">
          Add your original message once. GhostLink will adapt how it is delivered
          based on who opens it.
        </p>

        <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
              Title of your content
            </span>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              type="text"
              maxLength={120}
              required
              placeholder="Portfolio intro, campaign title, product launch..."
              className="rounded-2xl border border-slate-300/25 bg-slate-900/55 px-4 py-3 text-base text-slate-50 outline-none transition placeholder:text-slate-300/50 focus:border-cyan-200/70"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
              Main body / description
            </span>
            <textarea
              value={form.body}
              onChange={(event) =>
                setForm((current) => ({ ...current, body: event.target.value }))
              }
              rows={7}
              maxLength={7000}
              required
              placeholder="Describe your story, product, portfolio, or message..."
              className="rounded-2xl border border-slate-300/25 bg-slate-900/55 px-4 py-3 text-base text-slate-50 outline-none transition placeholder:text-slate-300/50 focus:border-cyan-200/70"
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                Call to action text (optional)
              </span>
              <input
                value={form.cta}
                onChange={(event) =>
                  setForm((current) => ({ ...current, cta: event.target.value }))
                }
                type="text"
                maxLength={80}
                placeholder="Book a call, View the repo, Buy now..."
                className="rounded-2xl border border-slate-300/25 bg-slate-900/55 px-4 py-3 text-base text-slate-50 outline-none transition placeholder:text-slate-300/50 focus:border-cyan-200/70"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-100/70">
                Call to action URL (optional)
              </span>
              <input
                value={form.ctaUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, ctaUrl: event.target.value }))
                }
                type="url"
                placeholder="https://example.com"
                className="rounded-2xl border border-slate-300/25 bg-slate-900/55 px-4 py-3 text-base text-slate-50 outline-none transition placeholder:text-slate-300/50 focus:border-cyan-200/70"
              />
            </label>
          </div>

          {errorMessage ? (
            <p className="rounded-xl border border-rose-300/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="rounded-full bg-[color:var(--accent-cyan)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Generating..." : "Generate GhostLink"}
            </button>
            <Link
              href="/"
              className="rounded-full border border-slate-300/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-100/90 transition hover:border-slate-100/60 hover:bg-slate-100/10"
            >
              Back to landing
            </Link>
          </div>

          {isSubmitting ? (
            <div className="mt-4 rounded-2xl border border-slate-200/20 bg-slate-950/35 p-4">
              <div className="skeleton-block h-4 w-36" />
              <div className="mt-3 skeleton-block h-4 w-full" />
              <div className="mt-2 skeleton-block h-4 w-11/12" />
              <div className="mt-2 skeleton-block h-4 w-10/12" />
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}