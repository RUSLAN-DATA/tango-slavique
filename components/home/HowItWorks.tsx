"use client";

import { motion } from "framer-motion";
import { Counter } from "@/components/Counter";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const luxuryEase = [0.16, 1, 0.3, 1] as const;

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, ease: luxuryEase },
  },
};

function parseMetric(value: string) {
  const suffix = value.endsWith("%") ? "%" : value.endsWith("+") ? "+" : "";
  return {
    target: Number.parseInt(value, 10) || 0,
    suffix,
  };
}

export function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section id="how-it-works" className="relative overflow-hidden scroll-mt-24 bg-transparent py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <img
          src="/how-it-works-couple.jpg"
          alt=""
          className="h-full w-full object-cover object-[center_30%] opacity-25"
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-amber-600/10 via-amber-400/15 to-rose-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10">
        <div className="px-4 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400/80">
            {t.how.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-normal text-white sm:text-4xl">
            {t.how.title}
          </h2>
          <div className="mx-auto mt-3 mb-16 h-[1px] w-16 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        </div>

        <motion.ol
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 text-center md:grid-cols-2 lg:grid-cols-4"
        >
          {t.how.steps.map((step) => (
            <motion.li key={step.number} variants={itemVariants}>
              <div className="group relative bg-transparent p-6 transition-all duration-700 ease-luxury sm:p-8">
                <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-amber-500/10 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />
                <p className="font-serif text-3xl text-amber-200 transition-all duration-700 group-hover:text-amber-300 group-hover:drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] sm:text-4xl">
                  {step.number}
                </p>
                <h3 className="mt-2 font-serif text-base tracking-wide text-white transition-colors duration-700 sm:text-lg">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs text-zinc-400 transition-colors duration-700 group-hover:text-zinc-200 sm:text-sm">
                  {step.text}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ol>

        <motion.div
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          className="mx-auto mt-20 grid max-w-4xl grid-cols-3 px-4 text-center"
        >
          {t.how.metrics.map((metric) => {
            const { target, suffix } = parseMetric(metric.value);
            return (
              <motion.div key={metric.label} variants={itemVariants}>
                <Counter
                  target={target}
                  suffix={suffix}
                  className="font-serif text-4xl tracking-tight text-amber-100 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] sm:text-5xl"
                />
                <p className="mt-2 text-[10px] font-light uppercase tracking-[0.25em] text-zinc-400 sm:text-xs">
                  {metric.label}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
