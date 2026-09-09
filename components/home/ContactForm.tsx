"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { GlowCard } from "@/components/ui/GlowCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import {
  cityKeys,
  type CityKey,
  type QuizResult,
} from "@/components/quiz/quizTypes";

type FormState = {
  name: string;
  phone: string;
  city: CityKey | "";
  lookingFor: "man" | "woman" | "";
  privacy: boolean;
  goal: QuizResult["goal"] | "";
  geography: QuizResult["geography"] | "";
  interviewReady: boolean;
};

const initialState: FormState = {
  name: "",
  phone: "",
  city: "",
  lookingFor: "",
  privacy: false,
  goal: "",
  geography: "",
  interviewReady: false,
};

const fieldClass =
  "w-full border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-base text-ivory outline-none backdrop-blur-sm transition-colors duration-300 placeholder:text-ivory/30 focus:border-gold";

type ContactFormProps = {
  quizResult?: QuizResult | null;
  lookingForPreset?: "man" | "woman" | null;
};

export function ContactForm({
  quizResult = null,
  lookingForPreset = null,
}: ContactFormProps) {
  const { t, locale } = useLanguage();
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [candidateCode, setCandidateCode] = useState("");

  useEffect(() => {
    if (!quizResult) {
      return;
    }

    setForm((current) => ({
      ...current,
      goal: quizResult.goal,
      geography: quizResult.geography,
      interviewReady: quizResult.interviewReady,
      city:
        quizResult.geography === "international" ? "other" : current.city,
    }));

    const timeoutId = window.setTimeout(() => {
      const phone = document.getElementById("contact-phone");
      phone?.scrollIntoView({ behavior: "smooth", block: "center" });
      phone?.focus();
    }, 420);

    return () => window.clearTimeout(timeoutId);
  }, [quizResult]);

  useEffect(() => {
    if (!lookingForPreset) {
      return;
    }

    setForm((current) => ({
      ...current,
      lookingFor: lookingForPreset,
    }));
  }, [lookingForPreset]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) {
      return;
    }

    const applicationId = `#TS-${Math.floor(1000 + Math.random() * 9000)}`;
    const formData = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      city: form.city ? t.form.cities[form.city] : "",
      lookingFor: form.lookingFor === "man" ? t.form.man : t.form.woman,
      privacyAccepted: form.privacy,
      goal: form.goal ? t.quiz.goals[form.goal] : "",
      geography: form.geography ? t.quiz.geography[form.geography] : "",
      interviewReady: form.interviewReady ? t.quiz.interviewReady : "",
      purpose: form.goal ? t.quiz.goals[form.goal] : "",
      contact: form.name.trim(),
      whatsapp: form.phone.trim(),
      details: [
        form.city ? t.form.cities[form.city] : "",
        form.lookingFor === "man" ? t.form.man : form.lookingFor === "woman" ? t.form.woman : "",
        form.geography ? t.quiz.geography[form.geography] : "",
        form.interviewReady ? t.quiz.interviewReady : "",
      ]
        .filter(Boolean)
        .join(" · "),
      submittedAt: new Date().toISOString(),
    };

    const payload = {
      ...formData,
      language: locale.toUpperCase() || "EN",
      applicationId,
    };

    setSubmitError("");
    setSending(true);

    try {
      const response = await fetch("/api/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        success?: boolean;
        id?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error("Application request failed");
      }

      setCandidateCode(data.id || applicationId);
      setSubmitted(true);
    } catch {
      setSubmitError(t.form.submitError);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (!submitted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [submitted]);

  function returnToSite() {
    setSubmitted(false);
    setCandidateCode("");
    setSubmitError("");
    setForm(initialState);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section id="contact" className="relative scroll-mt-24 bg-transparent py-24 md:py-32">
      <Container className="relative z-10">
        <FadeIn>
          <SectionHeading
            eyebrow={t.form.eyebrow}
            title={t.form.title}
            description={t.form.description}
          />
        </FadeIn>

        <GlowCard className="mx-auto mt-14 max-w-xl bg-transparent p-6 sm:p-10">
          <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {form.goal && form.geography ? (
                  <div className="glass-panel space-y-2 px-4 py-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-gold">
                      {t.form.fromQuiz}
                    </p>
                    <p className="text-sm font-light text-ivory">
                      {t.quiz.goals[form.goal]}
                    </p>
                    <p className="text-sm font-light text-ivory">
                      {t.quiz.geography[form.geography]}
                    </p>
                    {form.interviewReady ? (
                      <p className="text-sm font-light text-ivory">
                        {t.quiz.interviewReady}
                      </p>
                    ) : null}
                    <input type="hidden" name="goal" value={form.goal} />
                    <input
                      type="hidden"
                      name="geography"
                      value={form.geography}
                    />
                    <input
                      type="hidden"
                      name="interviewReady"
                      value="true"
                    />
                  </div>
                ) : null}

                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-ivory/55">
                    {t.form.name}
                  </span>
                  <input
                    required
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className={fieldClass}
                    placeholder={t.form.namePlaceholder}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-ivory/55">
                    {t.form.phone}
                  </span>
                  <input
                    required
                    id="contact-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className={fieldClass}
                    placeholder="+34 ..."
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-ivory/55">
                    {t.form.city}
                  </span>
                  <select
                    required
                    name="city"
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        city: event.target.value as CityKey,
                      }))
                    }
                    className={`${fieldClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22><path fill=%22%23C9A55C%22 d=%22M1 1l5 6 5-6%22/></svg>')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10`}
                  >
                    <option value="" disabled>
                      {t.form.cityPlaceholder}
                    </option>
                    {cityKeys.map((city) => (
                      <option key={city} value={city} className="bg-obsidian">
                        {t.form.cities[city]}
                      </option>
                    ))}
                  </select>
                </label>

                <fieldset>
                  <legend className="mb-3 block text-[11px] uppercase tracking-[0.16em] text-ivory/55">
                    {t.form.lookingFor}
                  </legend>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label
                      className={`cursor-pointer border px-4 py-3 text-center text-base transition-colors duration-300 ${
                        form.lookingFor === "woman"
                          ? "border-gold bg-woman/40 text-ivory"
                          : "border-white/[0.06] text-ivory/70 hover:border-amber-400/20"
                      }`}
                    >
                      <input
                        required
                        type="radio"
                        name="lookingFor"
                        value="woman"
                        checked={form.lookingFor === "woman"}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            lookingFor: "woman",
                          }))
                        }
                        className="sr-only"
                      />
                      {t.form.woman}
                    </label>
                    <label
                      className={`cursor-pointer border px-4 py-3 text-center text-base transition-colors duration-300 ${
                        form.lookingFor === "man"
                          ? "border-gold bg-man/50 text-ivory"
                          : "border-white/[0.06] text-ivory/70 hover:border-amber-400/20"
                      }`}
                    >
                      <input
                        required
                        type="radio"
                        name="lookingFor"
                        value="man"
                        checked={form.lookingFor === "man"}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            lookingFor: "man",
                          }))
                        }
                        className="sr-only"
                      />
                      {t.form.man}
                    </label>
                  </div>
                </fieldset>

                <label className="flex cursor-pointer items-start gap-3 pt-2 text-sm font-light leading-relaxed text-ivory-muted">
                  <input
                    required
                    type="checkbox"
                    checked={form.privacy}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        privacy: event.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border border-amber-500/40 bg-black/50 text-amber-500 accent-amber-500 focus:ring-amber-400/30 focus:ring-offset-0"
                  />
                  <span>
                    {t.form.privacyPrefix}
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-300 underline underline-offset-4 transition-colors hover:text-amber-200"
                    >
                      {t.form.privacyLink}
                    </a>
                    {t.form.privacySuffix}
                  </span>
                </label>

                {submitError ? (
                  <p className="text-sm font-light text-rose-300">{submitError}</p>
                ) : null}

                <motion.button
                  type="submit"
                  disabled={sending}
                  whileHover={{
                    y: -2,
                    boxShadow:
                      "0 0 0 1px rgba(201, 165, 92, 0.55), 0 12px 32px rgba(201, 165, 92, 0.28)",
                  }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full bg-gold py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-obsidian transition-colors duration-500 hover:bg-gold-light disabled:cursor-wait disabled:opacity-60"
                >
                  {t.form.submit}
                </motion.button>
              </motion.form>
        </GlowCard>
      </Container>

      <AnimatePresence>
        {submitted ? (
          <motion.div
            key="application-received"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#070709]/80 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-lg border border-amber-400/20 bg-[#0c0c10]/95 px-8 py-12 text-center shadow-[0_0_80px_rgba(201,165,92,0.08)] sm:px-12"
            >
              <h3 className="font-serif text-xl tracking-widest text-amber-200">
                {t.form.successTitle}
              </h3>
              <p className="mt-6 font-mono text-lg tracking-[0.2em] text-amber-300">
                {candidateCode}
              </p>
              <p className="mx-auto mt-8 max-w-md text-sm font-light leading-relaxed text-zinc-400">
                {t.form.successText}
              </p>
              <button
                type="button"
                onClick={returnToSite}
                className="mt-10 border border-amber-400/40 px-8 py-2.5 text-xs uppercase tracking-[0.2em] text-amber-200 transition-all duration-500 hover:border-amber-300 hover:bg-amber-400/10 hover:text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]"
              >
                {t.form.successReturn}
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
