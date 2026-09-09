"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Locale } from "@/lib/i18n/dictionary";

const options: Locale[] = ["en", "es"];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.18em]"
      role="group"
      aria-label="Language"
    >
      {options.map((option, index) => (
        <span key={option} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span aria-hidden className="text-ivory/25">
              |
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setLocale(option)}
            aria-pressed={locale === option}
            className={`transition-colors duration-300 ${
              locale === option
                ? "text-gold"
                : "text-ivory/40 hover:text-ivory/70"
            }`}
          >
            {option.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
