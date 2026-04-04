import type { PersonalizedContent } from "@/types";
import type { ResolveMatchType } from "@/types";

interface ContentRendererProps {
  content: PersonalizedContent;
  matchType?: ResolveMatchType;
}

function getMatchLabel(matchType?: ResolveMatchType): string {
  if (matchType === "rule") {
    return "Matched by rules";
  }

  if (matchType === "ai") {
    return "Matched by AI";
  }

  if (matchType === "default") {
    return "Default fallback";
  }

  return "";
}

export default function ContentRenderer({ content, matchType }: ContentRendererProps) {
  const paragraphs = content.body
    .split("\n")
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const toneLabel = `${content.tone[0].toUpperCase()}${content.tone.slice(1)}`;
  const matchLabel = getMatchLabel(matchType);

  return (
    <article className="hero-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-100/72">
          Personalized for this visit
        </p>
        <span className="rounded-full border border-cyan-100/35 bg-cyan-900/20 px-3 py-1 text-xs uppercase tracking-[0.14em] text-cyan-50">
          Tone: {toneLabel}
        </span>
        {matchLabel ? (
          <span className="rounded-full border border-emerald-100/35 bg-emerald-900/20 px-3 py-1 text-xs uppercase tracking-[0.14em] text-emerald-50">
            {matchLabel}
          </span>
        ) : null}
      </div>
      <h1 className="mt-3 text-4xl leading-tight text-slate-50 sm:text-5xl">
        {content.headline}
      </h1>
      <p className="mt-3 text-base text-slate-200/80">{content.title}</p>

      <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-100/85">
        {paragraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph}`}>{paragraph}</p>
        ))}
      </div>

      {content.cta ? (
        <div className="mt-8">
          {content.ctaUrl ? (
            <a
              href={content.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-[color:var(--accent-cyan)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:-translate-y-0.5 hover:brightness-110"
            >
              {content.cta}
            </a>
          ) : (
            <p className="inline-flex rounded-full border border-cyan-100/35 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-50">
              {content.cta}
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}
