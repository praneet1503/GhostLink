import Link from "next/link";

const steps = [
  {
    id: "01",
    title: "Create one source message",
    detail:
      "Drop in your portfolio, launch note, or campaign copy once and publish a single GhostLink.",
  },
  {
    id: "02",
    title: "Signals read the room",
    detail:
      "Timezone, device, language, and traffic source quietly shape how your visitor should be addressed.",
  },
  {
    id: "03",
    title: "Deliver tailored output",
    detail:
      "The same URL serves a different narrative per visitor while keeping your core facts untouched.",
  },
] as const;

const personaLines = [
  "A recruiter opening from LinkedIn at 10:07 AM",
  "A friend landing from WhatsApp after midnight",
  "A developer arriving from GitHub on desktop",
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
              className="rounded-full border border-slate-300/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-100 transition hover:border-slate-100/60 hover:bg-slate-100/10 sm:text-sm"
            >
              Dashboard
            </Link>
            <Link
              href="/create"
              className="rounded-full border border-cyan-200/40 bg-cyan-200/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-50 transition hover:border-cyan-100/70 hover:bg-cyan-200/20 sm:text-sm"
            >
              Launch Creator
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
                className="rounded-full bg-[color:var(--accent-cyan)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                Start Building
              </Link>
              <a
                href="#how-it-works"
                className="rounded-full border border-slate-300/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-100/90 transition hover:border-slate-100/60 hover:bg-slate-100/10"
              >
                How It Works
              </a>
            </div>

            <div
              className="reveal-up mt-8 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-cyan-100/70 sm:text-sm"
              style={{ animationDelay: "360ms" }}
            >
              <span className="rounded-full border border-slate-300/30 px-3 py-1.5">
                Same URL
              </span>
              <span className="h-px w-8 bg-slate-200/25" aria-hidden="true" />
              <span className="rounded-full border border-slate-300/30 px-3 py-1.5">
                Infinite Experiences
              </span>
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
              No signup from visitors. No surveys. The page reads available
              context and serves a tailored version of your content in real
              time.
            </p>
          </aside>
        </section>

        <section id="how-it-works" className="mt-20">
          <h2 className="reveal-up text-3xl text-slate-50 sm:text-4xl">
            How it works
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.id}
                className="reveal-up rounded-3xl border border-slate-200/20 bg-slate-950/35 p-6 shadow-[0_20px_40px_rgba(4,10,22,0.3)]"
                style={{ animationDelay: `${220 + index * 90}ms` }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/72">
                  Step {step.id}
                </p>
                <h3 className="mt-3 text-2xl text-slate-50">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-200/75">
                  {step.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-auto pt-16 text-sm text-slate-200/70">
          Built for portfolios, product launches, and unforgettable demo moments.
        </footer>
      </div>
    </main>
  );
}
