"use client";

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";

type StubPageProps = {
  pageKey: keyof Dictionary["pages"];
};

export function StubPage({ pageKey }: StubPageProps) {
  const { t } = useLanguage();
  const page = t.pages[pageKey];

  return (
    <main className="pt-28">
      <Container className="max-w-3xl py-16 md:py-24">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-brand text-gold">
          {page.eyebrow}
        </p>
        <h1 className="font-display text-3xl font-normal text-ivory sm:text-5xl">
          {page.title}
        </h1>
        <p className="mt-8 text-base font-light leading-relaxed text-ivory-muted">
          {page.body}
        </p>
        <Link
          href="/"
          className="mt-12 inline-block text-[11px] uppercase tracking-[0.18em] text-gold"
        >
          {t.legal.home}
        </Link>
      </Container>
    </main>
  );
}
