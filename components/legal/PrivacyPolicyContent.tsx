"use client";

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function PrivacyPolicyContent() {
  const { t } = useLanguage();

  return (
    <main className="pt-28">
      <Container className="max-w-3xl py-16 md:py-24">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-brand text-gold">
          {t.footer.privacy}
        </p>
        <h1 className="font-display text-3xl font-normal text-ivory sm:text-5xl">
          {t.legal.privacyTitle}
        </h1>
        <div className="mt-8 space-y-5 text-base font-light leading-relaxed text-ivory-muted">
          <p>{t.legal.privacyP1}</p>
          <p>{t.legal.privacyP2}</p>
        </div>
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
