"use client";

import { motion } from "framer-motion";
import { GenderApplyLink } from "@/components/apply/GenderApplyLink";
import { HashLink } from "@/components/ui/HashLink";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative flex min-h-screen items-center justify-center border-0 bg-transparent shadow-none">
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 pb-24 pt-28 text-center sm:px-6">
        <motion.p
          custom={0.1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-7 inline-flex items-center border border-amber-400/20 bg-white/[0.02] px-4 py-2 text-[10px] font-medium uppercase tracking-brand text-gold sm:text-[11px]"
        >
          {t.hero.badge}
        </motion.p>

        <motion.h1
          custom={0.22}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="max-w-3xl text-balance font-display text-3xl font-normal leading-[1.15] text-ivory sm:text-5xl lg:text-6xl"
        >
          {t.hero.title}
        </motion.h1>

        <motion.p
          custom={0.38}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-7 max-w-2xl text-base font-light leading-relaxed text-ivory-muted sm:text-lg md:text-xl"
        >
          {t.hero.lead}
        </motion.p>

        <motion.div
          custom={0.52}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-10 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <GenderApplyLink href="/apply/women" className="w-full sm:w-auto">
            {t.gender.womenCta}
          </GenderApplyLink>
          <GenderApplyLink href="/apply/men" className="w-full sm:w-auto">
            {t.gender.menCta}
          </GenderApplyLink>
          <HashLink
            href="/#how-it-works"
            className="inline-flex items-center gap-2 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ivory/70 transition-colors duration-500 hover:text-gold"
          >
            {t.hero.secondary}
          </HashLink>
        </motion.div>
      </div>
    </section>
  );
}
