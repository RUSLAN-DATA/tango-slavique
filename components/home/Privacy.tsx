"use client";

import { EyeOff, FileLock, LockKeyhole } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { GlowCard } from "@/components/ui/GlowCard";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const icons = [EyeOff, FileLock, LockKeyhole];

export function Privacy() {
  const { t } = useLanguage();

  return (
    <section id="privacy" className="relative scroll-mt-24 bg-transparent py-24 md:py-32">
      <Container className="relative z-10">
        <GlowCard className="bg-transparent px-6 py-12 text-center sm:px-12 md:py-16">
          <p className="text-[11px] font-medium uppercase tracking-brand text-gold">
            {t.privacy.eyebrow}
          </p>
          <h2 className="mx-auto mt-5 max-w-3xl text-balance font-display text-3xl font-normal leading-tight text-ivory sm:text-5xl lg:text-6xl">
            {t.privacy.title}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed text-ivory-muted md:text-lg">
            {t.privacy.description}
          </p>
        </GlowCard>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {t.privacy.points.map((point, index) => {
            const Icon = icons[index];
            return (
              <GlowCard
                key={point.title}
                delay={0.08 * index}
                className="h-full bg-transparent p-7"
              >
                <Icon className="mb-5 text-gold" size={22} strokeWidth={1.5} />
                <h3 className="font-display text-xl font-normal text-ivory">
                  {point.title}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-ivory-muted">
                  {point.text}
                </p>
              </GlowCard>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
