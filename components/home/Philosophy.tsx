"use client";

import {
  Ban,
  Bot,
  Clock,
  Smartphone,
  Gem,
  ShieldCheck,
  UserRoundCog,
  Scale,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { GlowCard } from "@/components/ui/GlowCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const datingIcons = [Smartphone, Bot, Clock, Ban];
const clubIcons = [Gem, ShieldCheck, Scale, UserRoundCog];

export function Philosophy() {
  const { t } = useLanguage();

  return (
    <section id="advantages" className="relative scroll-mt-24 bg-transparent py-24 md:py-32">
      <Container className="relative z-10">
        <FadeIn>
          <SectionHeading
            eyebrow={t.philosophy.eyebrow}
            title={t.philosophy.title}
            description={t.philosophy.description}
          />
        </FadeIn>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <GlowCard className="h-full bg-transparent p-8 md:p-10">
            <article>
              <p className="text-[11px] font-medium uppercase tracking-brand text-silver">
                {t.philosophy.appsLabel}
              </p>
              <h3 className="mt-3 font-display text-2xl font-normal text-ivory/80 sm:text-3xl">
                {t.philosophy.appsTitle}
              </h3>
              <ul className="mt-8 space-y-6">
                {t.philosophy.apps.map((item, index) => {
                  const Icon = datingIcons[index];
                  return (
                    <li key={item.title} className="flex gap-4">
                      <Icon
                        className="mt-0.5 shrink-0 text-silver-muted"
                        size={20}
                        strokeWidth={1.5}
                      />
                      <div>
                        <p className="text-sm font-medium text-ivory/80">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm font-light leading-relaxed text-ivory-faint">
                          {item.text}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          </GlowCard>

          <GlowCard delay={0.12} className="h-full bg-transparent p-8 md:p-10">
            <article>
              <p className="text-[11px] font-medium uppercase tracking-brand text-gold">
                {t.philosophy.clubLabel}
              </p>
              <h3 className="mt-3 font-display text-2xl font-normal text-ivory sm:text-3xl">
                {t.philosophy.clubTitle}
              </h3>
              <ul className="mt-8 space-y-6">
                {t.philosophy.advantages.map((item, index) => {
                  const Icon = clubIcons[index];
                  return (
                    <li key={item.title} className="flex gap-4">
                      <Icon
                        className="mt-0.5 shrink-0 text-gold"
                        size={20}
                        strokeWidth={1.5}
                      />
                      <div>
                        <p className="text-sm font-medium text-ivory">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm font-light leading-relaxed text-ivory-muted">
                          {item.text}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </article>
          </GlowCard>
        </div>
      </Container>
    </section>
  );
}
