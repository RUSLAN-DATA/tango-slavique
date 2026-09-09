"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cityKeys, type CityKey } from "@/components/quiz/quizTypes";

const fieldClass =
  "w-full border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-base text-ivory outline-none backdrop-blur-sm transition-colors duration-300 placeholder:text-ivory/30 focus:border-gold";

type GenderedApplicationFormProps = {
  track: "men" | "women";
};

export function GenderedApplicationForm({
  track,
}: GenderedApplicationFormProps) {
  const { t, locale } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState<CityKey | "">("");
  const [cityText, setCityText] = useState("");
  const [lookingFor, setLookingFor] = useState<"man" | "woman">(
    track === "men" ? "woman" : "man"
  );
  const [privacy, setPrivacy] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [candidateCode, setCandidateCode] = useState("");

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) {
      return;
    }

    const applicationId = `#TS-${Math.floor(1000 + Math.random() * 9000)}`;
    const resolvedCity =
      track === "women"
        ? cityText.trim()
        : city
          ? t.form.cities[city]
          : "";
    const purpose =
      track === "men"
        ? t.apply.men.terms
        : t.apply.women.status;
    const details = [
      track === "women" ? age.trim() : "",
      resolvedCity,
      track === "men"
        ? lookingFor === "man"
          ? t.form.man
          : t.form.woman
        : "",
    ]
      .filter(Boolean)
      .join(" · ");

    const payload = {
      applicant: track === "men" ? "Gentleman" : "Woman",
      name: name.trim(),
      contact: name.trim(),
      phone: phone.trim(),
      whatsapp: phone.trim(),
      age: age.trim(),
      city: resolvedCity,
      lookingFor: track === "men" ? (lookingFor === "man" ? t.form.man : t.form.woman) : "",
      purpose,
      details,
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

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-ivory/55">
            {t.form.name}
          </span>
          <input
            required
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={fieldClass}
            placeholder={t.form.namePlaceholder}
          />
        </label>

        {track === "women" ? (
          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-ivory/55">
              {t.apply.age}
            </span>
            <input
              required
              name="age"
              inputMode="numeric"
              value={age}
              onChange={(event) => setAge(event.target.value)}
              className={fieldClass}
              placeholder={t.apply.agePlaceholder}
            />
          </label>
        ) : null}

        {track === "women" ? (
          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-ivory/55">
              {t.apply.cityText}
            </span>
            <input
              required
              name="city"
              value={cityText}
              onChange={(event) => setCityText(event.target.value)}
              className={fieldClass}
              placeholder={t.apply.cityPlaceholder}
            />
          </label>
        ) : (
          <label className="block">
            <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-ivory/55">
              {t.form.city}
            </span>
            <select
              required
              name="city"
              value={city}
              onChange={(event) => setCity(event.target.value as CityKey)}
              className={`${fieldClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22><path fill=%22%23C9A55C%22 d=%22M1 1l5 6 5-6%22/></svg>')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10`}
            >
              <option value="" disabled>
                {t.form.cityPlaceholder}
              </option>
              {cityKeys.map((key) => (
                <option key={key} value={key} className="bg-obsidian">
                  {t.form.cities[key]}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.16em] text-ivory/55">
            {t.form.phone}
          </span>
          <input
            required
            type="tel"
            name="phone"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={fieldClass}
            placeholder="+34 ..."
          />
        </label>

        {track === "men" ? (
          <fieldset>
            <legend className="mb-3 block text-[11px] uppercase tracking-[0.16em] text-ivory/55">
              {t.form.lookingFor}
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer border px-4 py-3 text-center text-base transition-colors duration-300 ${
                  lookingFor === "woman"
                    ? "border-gold bg-woman/40 text-ivory"
                    : "border-white/[0.06] text-ivory/70 hover:border-amber-400/20"
                }`}
              >
                <input
                  required
                  type="radio"
                  name="lookingFor"
                  value="woman"
                  checked={lookingFor === "woman"}
                  onChange={() => setLookingFor("woman")}
                  className="sr-only"
                />
                {t.form.woman}
              </label>
              <label
                className={`cursor-pointer border px-4 py-3 text-center text-base transition-colors duration-300 ${
                  lookingFor === "man"
                    ? "border-gold bg-man/50 text-ivory"
                    : "border-white/[0.06] text-ivory/70 hover:border-amber-400/20"
                }`}
              >
                <input
                  required
                  type="radio"
                  name="lookingFor"
                  value="man"
                  checked={lookingFor === "man"}
                  onChange={() => setLookingFor("man")}
                  className="sr-only"
                />
                {t.form.man}
              </label>
            </div>
          </fieldset>
        ) : null}

        <label className="flex cursor-pointer items-start gap-3 pt-2 text-sm font-light leading-relaxed text-ivory-muted">
          <input
            required
            type="checkbox"
            checked={privacy}
            onChange={(event) => setPrivacy(event.target.checked)}
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
      </form>

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
              <a
                href="/"
                className="mt-10 inline-block border border-amber-400/40 px-8 py-2.5 text-xs uppercase tracking-[0.2em] text-amber-200 transition-all duration-500 hover:border-amber-300 hover:bg-amber-400/10 hover:text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]"
              >
                {t.form.successReturn}
              </a>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
