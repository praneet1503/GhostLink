import Link from "next/link";

const personaLines = [
  "A recruiter opening from LinkedIn at 10:07 AM",
  "A friend landing from WhatsApp after midnight",
  "A developer arriving from GitHub on desktop",
  "A founder checking your work from Product Hunt during lunch",
  "A hiring manager revisiting from email on a tablet",
  "A designer exploring from Behance before a client meeting",
  "A student opening from Reddit while comparing portfolios",
  "A creator arriving from YouTube right after your demo",
  "A potential client tapping in from Instagram stories",
  "A recruiter opening from LinkedIn at 10:07 AM",
] as const;

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="orb orb-cyan" aria-hidden="true" />
      <div className="orb orb-gold" aria-hidden="true" />
      <div className="grid-noise" aria-hidden="true" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-10 pt-7 sm:px-8 lg:px-10">
        <header
          className="reveal-up flex items-center justify-between"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-3">
            <span className="ghost-glow" aria-hidden="true">
              👻
            </span>
            <span className="text-xs uppercase tracking-[0.24em] text-cyan-100/85 sm:text-sm">
              GhostLink
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-100 transition hover:border-slate-100/60 hover:bg-slate-100/10 sm:text-sm"
            >
              <i className="bi bi-speedometer2" aria-hidden="true" />
              Dashboard
            </Link>
          </div>
        </header>

        <section className="mt-14 grid items-start gap-12 lg:mt-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p
              className="reveal-up text-xs uppercase tracking-[0.2em] text-cyan-100/70"
              style={{ animationDelay: "120ms" }}
            >
              AI-powered adaptive content delivery
            </p>
            <h1
              className="reveal-up mt-4 max-w-3xl text-4xl leading-tight text-slate-50 sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "180ms" }}
            >
              One link. A different experience for everyone.
            </h1>
            <p
              className="reveal-up mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--text-soft)] sm:text-lg"
              style={{ animationDelay: "240ms" }}
            >
              Build one GhostLink and let passive browser context adapt your
              message for each visitor. Recruiters see polish, friends see
              personality, developers see depth.
            </p>

            <div
              className="reveal-up mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent-cyan)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                <i className="bi bi-rocket-takeoff" aria-hidden="true" />
                Start Building
              </Link>
            </div>
          </div>

          <aside
            className="hero-panel reveal-up"
            style={{ animationDelay: "220ms" }}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/72">
              Persona stream
            </p>
            <h2 className="mt-3 text-2xl text-slate-50 sm:text-3xl">
              The same GhostLink shifts its voice for:
            </h2>
            <div className="persona-frame mt-6">
              <div className="persona-strip">
                {personaLines.map((line, index) => (
                  <span key={`${line}-${index}`}>{line}</span>
                ))}
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-slate-200/75">
              No signup. No forms. Just adaptive delivery.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
