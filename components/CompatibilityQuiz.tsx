"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { QuizGeography, QuizGoal, QuizResult } from "@/components/quiz/quizTypes";

type CompatibilityQuizProps = {
  onComplete: (result: QuizResult) => void;
  completed?: QuizResult | null;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function CompatibilityQuiz({
  onComplete,
  completed = null,
}: CompatibilityQuizProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<QuizGoal | "">("");
  const [geography, setGeography] = useState<QuizGeography | "">("");
  const [direction, setDirection] = useState(1);

  const goalOptions: { value: QuizGoal; label: string; hint: string }[] = [
    {
      value: "family",
      label: t.quiz.goals.family,
      hint: t.quiz.goalHints.family,
    },
    {
      value: "longterm",
      label: t.quiz.goals.longterm,
      hint: t.quiz.goalHints.longterm,
    },
  ];

  const geographyOptions: {
    value: QuizGeography;
    label: string;
    hint: string;
  }[] = [
    {
      value: "spain",
      label: t.quiz.geography.spain,
      hint: t.quiz.geographyHints.spain,
    },
    {
      value: "europe",
      label: t.quiz.geography.europe,
      hint: t.quiz.geographyHints.europe,
    },
    {
      value: "international",
      label: t.quiz.geography.international,
      hint: t.quiz.geographyHints.international,
    },
  ];

  function goTo(nextStep: number) {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  }

  function finish() {
    if (!goal || !geography) {
      return;
    }

    onComplete({
      goal,
      geography,
      interviewReady: true,
    });
  }

  return (
    <section id="compatibility" className="relative scroll-mt-24 bg-transparent py-24 md:py-32">
      <Container className="relative z-10">
        <FadeIn>
          <SectionHeading
            eyebrow={t.quiz.eyebrow}
            title={t.quiz.title}
            description={t.quiz.description}
          />
        </FadeIn>

        <div className="mx-auto mt-14 max-w-2xl bg-transparent p-6 sm:p-10">
          {completed ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="text-center"
            >
              <p className="text-[11px] font-medium uppercase tracking-brand text-gold">
                {t.quiz.profile}
              </p>
              <h3 className="mt-3 font-display text-2xl font-normal text-ivory sm:text-3xl">
                {t.quiz.fit}
              </h3>
              <ul className="mt-8 space-y-3 text-left text-sm font-light text-ivory-muted">
                <li className="glass-panel px-4 py-3">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-gold/80">
                    {t.quiz.goalLabel}
                  </span>
                  {t.quiz.goals[completed.goal]}
                </li>
                <li className="glass-panel px-4 py-3">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-gold/80">
                    {t.quiz.geographyLabel}
                  </span>
                  {t.quiz.geography[completed.geography]}
                </li>
                <li className="glass-panel px-4 py-3">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-gold/80">
                    {t.quiz.interviewLabel}
                  </span>
                  {t.quiz.interviewReady}
                </li>
              </ul>
              <p className="mt-6 text-sm font-light text-ivory-faint">
                {t.quiz.transferred}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="mb-8 flex items-center justify-between">
                <p className="font-display text-2xl text-gold/70">
                  0{step} / 03
                </p>
                <div className="relative mx-4 h-px flex-1 overflow-hidden bg-white/[0.06]">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gold"
                    initial={false}
                    animate={{ width: `${(step / 3) * 100}%` }}
                    transition={{ duration: 0.45, ease }}
                  />
                </div>
              </div>

              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -28 }}
                  transition={{ duration: 0.4, ease }}
                >
                  {step === 1 ? (
                    <div>
                      <h3 className="font-display text-2xl text-ivory sm:text-3xl">
                        {t.quiz.stepGoal}
                      </h3>
                      <div className="mt-6 grid gap-3">
                        {goalOptions.map((option) => (
                          <OptionButton
                            key={option.value}
                            selected={goal === option.value}
                            title={option.label}
                            hint={option.hint}
                            onClick={() => {
                              setGoal(option.value);
                              window.setTimeout(() => goTo(2), 180);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div>
                      <h3 className="font-display text-2xl text-ivory sm:text-3xl">
                        {t.quiz.stepGeography}
                      </h3>
                      <div className="mt-6 grid gap-3">
                        {geographyOptions.map((option) => (
                          <OptionButton
                            key={option.value}
                            selected={geography === option.value}
                            title={option.label}
                            hint={option.hint}
                            onClick={() => {
                              setGeography(option.value);
                              window.setTimeout(() => goTo(3), 180);
                            }}
                          />
                        ))}
                      </div>
                      <BackButton
                        label={t.quiz.back}
                        onClick={() => goTo(1)}
                      />
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div>
                      <h3 className="font-display text-2xl text-ivory sm:text-3xl">
                        {t.quiz.stepInterview}
                      </h3>
                      <p className="mt-3 text-sm font-light leading-relaxed text-ivory-muted">
                        {t.quiz.interviewHint}
                      </p>
                      <motion.button
                        type="button"
                        onClick={finish}
                        whileHover={{
                          y: -2,
                          boxShadow:
                            "0 0 0 1px rgba(201, 165, 92, 0.55), 0 12px 32px rgba(201, 165, 92, 0.28)",
                        }}
                        whileTap={{ scale: 0.985 }}
                        className="mt-8 w-full border border-gold bg-gold px-5 py-4 text-[11px] font-medium uppercase tracking-[0.18em] text-obsidian"
                      >
                        {t.quiz.interviewReady}
                      </motion.button>
                      <BackButton
                        label={t.quiz.back}
                        onClick={() => goTo(2)}
                      />
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </Container>
    </section>
  );
}

function OptionButton({
  selected,
  title,
  hint,
  onClick,
}: {
  selected: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{
        y: -2,
        boxShadow:
          "0 0 0 1px rgba(201, 165, 92, 0.45), 0 10px 28px rgba(201, 165, 92, 0.12)",
      }}
      whileTap={{ scale: 0.99 }}
      className={`w-full px-5 py-4 text-left transition-colors duration-300 ${
        selected
          ? "border border-amber-400/40 bg-gold/[0.08] text-ivory"
          : "border border-white/[0.06] text-ivory/85 hover:border-amber-400/20"
      }`}
    >
      <span className="block font-display text-xl text-ivory">{title}</span>
      <span className="mt-1 block text-sm font-light text-ivory-muted">
        {hint}
      </span>
    </motion.button>
  );
}

function BackButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 text-[11px] uppercase tracking-[0.16em] text-ivory/45 transition-colors hover:text-gold"
    >
      {label}
    </button>
  );
}
