"use client";

import { ShieldCheck, UserRoundCheck, HeartHandshake } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { GlowCard } from "@/components/ui/GlowCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const icons = [UserRoundCheck, ShieldCheck, HeartHandshake];

export function ClubIntro() {
  const { t } = useLanguage();

  return (
    <section
      id="club"
      className="relative scroll-mt-24 border-0 border-t-0 bg-transparent py-24 md:py-32 shadow-none"
    >
      <Container className="relative z-10 bg-transparent">
        <FadeIn>
          <SectionHeading
            eyebrow={t.club.eyebrow}
            title={t.club.title}
            description={t.club.description}
          />
        </FadeIn>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {t.club.pillars.map((pillar, index) => {
            const Icon = icons[index];
            return (
              <GlowCard
                key={pillar.title}
                delay={0.08 * index}
                className="h-full bg-transparent p-7"
              >
                <Icon className="mb-6 text-gold" size={22} strokeWidth={1.5} />
                <h3 className="font-display text-xl font-normal text-ivory sm:text-2xl">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-ivory-muted">
                  {pillar.text}
                </p>
              </GlowCard>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
