"use client";

import { motion } from "framer-motion";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { cityKeys, type CityKey } from "@/components/quiz/quizTypes";
import { writeScreening } from "@/lib/screening";

const fieldClass =
  "w-full border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-base text-ivory outline-none backdrop-blur-sm transition-colors duration-300 placeholder:text-ivory/30 focus:border-gold";

type GenderedApplicationFormProps = {
  track: "men" | "women";
};

export function GenderedApplicationForm({
  track,
}: GenderedApplicationFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState<CityKey | "">("");
  const [cityText, setCityText] = useState("");
  const [lookingFor, setLookingFor] = useState<"man" | "woman">(
    track === "men" ? "woman" : "man"
  );
  const [privacy, setPrivacy] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const resolvedCity =
      track === "women"
        ? cityText.trim()
        : city
          ? t.form.cities[city]
          : "";

    writeScreening({
      name: name.trim(),
      phone: phone.trim(),
      city: resolvedCity,
      lookingFor: track === "men" ? lookingFor : undefined,
      track: track === "men" ? "MAN" : "WOMAN",
    });

    const role = track === "men" ? "MAN" : "WOMAN";
    const next = track === "men" ? "/apply/men/form" : "/apply/women/form";
    router.push(`/register?role=${role}&next=${encodeURIComponent(next)}`);
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

        <motion.button
          type="submit"
          whileHover={{
            y: -2,
            boxShadow:
              "0 0 0 1px rgba(201, 165, 92, 0.55), 0 12px 32px rgba(201, 165, 92, 0.28)",
          }}
          whileTap={{ scale: 0.985 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full bg-gold py-3.5 text-[11px] font-medium uppercase tracking-[0.18em] text-obsidian transition-colors duration-500 hover:bg-gold-light"
        >
          {t.platform.screening.continue}
        </motion.button>
      </form>
    </>
  );
}
