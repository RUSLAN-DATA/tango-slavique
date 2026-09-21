"use client";

import { Container } from "@/components/ui/Container";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export function FaqList() {
  const { t } = useLanguage();
  const page = t.pages.faq;
  const items = page.items || [];

  return (
    <main id="faq" className="pt-28">
      <Container className="max-w-3xl py-16 md:py-24">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-brand text-gold">{page.eyebrow}</p>
        <h1 className="font-display text-3xl font-normal text-ivory sm:text-5xl">{page.title}</h1>
        <p className="mt-8 text-base font-light leading-relaxed text-ivory-muted">{page.body}</p>
        <div className="mt-14 space-y-8">
          {items.map((item) => (
            <article key={item.question} className="border-t border-white/10 pt-8">
              <h2 className="font-display text-xl text-ivory">{item.question}</h2>
              <p className="mt-4 text-sm font-light leading-relaxed text-ivory-muted">{item.answer}</p>
            </article>
          ))}
        </div>
      </Container>
    </main>
  );
}
