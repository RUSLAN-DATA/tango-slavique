"use client";

import Link from "next/link";
import { GenderedApplicationForm } from "@/components/apply/GenderedApplicationForm";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type ApplyTrackPageProps = {
  track: "men" | "women";
};

export function ApplyTrackPage({ track }: ApplyTrackPageProps) {
  const { t } = useLanguage();
  const copy = track === "men" ? t.apply.men : t.apply.women;
  const values = copy.values;

  return (
    <main className="relative min-h-screen bg-transparent">
      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6">
        <Link
          href="/"
          className="inline-block text-xs text-zinc-400 transition-colors hover:text-amber-300"
        >
          ← {t.apply.back}
        </Link>

        <header className="mt-12 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400/80">
            {track === "women" ? t.apply.women.status : t.apply.men.termsLabel}
          </p>
          <h1 className="mt-4 font-serif text-3xl font-normal text-white sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base font-light leading-relaxed text-zinc-400 sm:text-lg">
            {copy.subtitle}
          </p>
          {track === "men" ? (
            <p className="mx-auto mt-6 max-w-xl border border-amber-500/20 bg-white/[0.03] px-5 py-4 font-serif text-sm tracking-wide text-amber-100/90 backdrop-blur-sm">
              {t.apply.men.terms}
            </p>
          ) : null}
        </header>

        <section className="mt-14">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-amber-400/80">
            {copy.valuesTitle}
          </p>
          <ul className="mt-8 space-y-4">
            {values.map((value) => (
              <li
                key={value}
                className="border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-sm font-light leading-relaxed text-zinc-300 backdrop-blur-sm"
              >
                {value}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <GenderedApplicationForm track={track} />
        </section>
      </div>
    </main>
  );
}
