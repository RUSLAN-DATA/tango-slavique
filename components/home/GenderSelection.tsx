"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { GenderApplyLink } from "@/components/apply/GenderApplyLink";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

type HoveredGender = "woman" | "man" | null;

const luxuryEase = [0.16, 1, 0.3, 1] as const;

function VenusSymbol({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`h-[100px] w-[100px] transition-all duration-700 ease-luxury sm:h-[120px] sm:w-[120px] ${
        active
          ? "text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
          : "text-amber-400/40"
      }`}
      fill="none"
      aria-hidden
    >
      <circle cx="60" cy="46" r="28" stroke="currentColor" strokeWidth="1.4" />
      <line
        x1="60"
        y1="74"
        x2="60"
        y2="108"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line
        x1="42"
        y1="92"
        x2="78"
        y2="92"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function MarsSymbol({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={`h-[100px] w-[100px] transition-all duration-700 ease-luxury sm:h-[120px] sm:w-[120px] ${
        active
          ? "text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
          : "text-amber-400/40"
      }`}
      fill="none"
      aria-hidden
    >
      <circle cx="48" cy="72" r="28" stroke="currentColor" strokeWidth="1.4" />
      <line
        x1="68"
        y1="52"
        x2="100"
        y2="20"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <polyline
        points="82,20 100,20 100,38"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ConstellationArcs({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 800 220"
      className="pointer-events-none absolute inset-x-0 top-[18%] hidden h-[46%] w-full md:block"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M70 150 C 220 28, 580 28, 730 150"
        className={`constellation-orbit stroke-amber-400/40 ${active ? "is-active" : ""}`}
        strokeWidth="1"
      />
      <path
        d="M90 168 C 250 210, 550 210, 710 168"
        className={`constellation-orbit stroke-amber-400/30 ${active ? "is-active" : ""}`}
        strokeWidth="1"
        style={{ animationDelay: "0.35s" }}
      />
      <g className={`constellation-core ${active ? "is-active" : ""}`}>
        <circle cx="400" cy="88" r="14" fill="#C9A55C" fillOpacity="0.08" />
        <circle cx="400" cy="88" r="5" fill="#C9A55C" fillOpacity="0.55" />
        <circle cx="400" cy="88" r="2" fill="#E8D5A3" />
      </g>
      <circle cx="190" cy="72" r="1.4" fill="#C9A55C" fillOpacity="0.7" />
      <circle cx="610" cy="72" r="1.4" fill="#C9A55C" fillOpacity="0.7" />
      <circle cx="280" cy="48" r="1.1" fill="#C9A55C" fillOpacity="0.5" />
      <circle cx="520" cy="48" r="1.1" fill="#C9A55C" fillOpacity="0.5" />
    </svg>
  );
}

export function GenderSelection() {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState<HoveredGender>(null);

  return (
    <section
      id="gender"
      className="relative overflow-hidden scroll-mt-24 bg-transparent py-24 md:py-32"
    >
      <div className="relative z-10 px-4 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400/80">
          {t.gender.eyebrow}
        </p>
        <h2 className="mt-3 font-serif text-3xl font-normal text-white sm:text-4xl">
          {t.gender.title}
        </h2>
        <div className="mx-auto mt-3 mb-16 h-[1px] w-12 bg-amber-400/60" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 gap-14 px-4 md:grid-cols-2 md:gap-8">
        <ConstellationArcs active={hovered !== null} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.85, ease: luxuryEase }}
          onMouseEnter={() => setHovered("woman")}
          onMouseLeave={() => setHovered(null)}
          onFocusCapture={() => setHovered("woman")}
          onBlurCapture={() => setHovered(null)}
          className="group/woman relative z-10 flex flex-col items-center text-center"
        >
          <VenusSymbol active={hovered === "woman"} />
          <h3 className="mt-6 font-serif text-xl text-white sm:text-2xl">
            {t.gender.womenTitle}
          </h3>
          <GenderApplyLink href="/apply/women" className="mt-8">
            {t.gender.womenCta}
          </GenderApplyLink>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.85, delay: 0.12, ease: luxuryEase }}
          onMouseEnter={() => setHovered("man")}
          onMouseLeave={() => setHovered(null)}
          onFocusCapture={() => setHovered("man")}
          onBlurCapture={() => setHovered(null)}
          className="group/man relative z-10 flex flex-col items-center text-center"
        >
          <MarsSymbol active={hovered === "man"} />
          <h3 className="mt-6 font-serif text-xl text-white sm:text-2xl">
            {t.gender.menTitle}
          </h3>
          <GenderApplyLink href="/apply/men" className="mt-8">
            {t.gender.menCta}
          </GenderApplyLink>
        </motion.div>
      </div>
    </section>
  );
}
