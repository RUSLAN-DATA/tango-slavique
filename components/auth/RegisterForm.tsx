"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { fieldClass, goldButtonClass, labelClass } from "@/components/ui/formStyles";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { readScreening, writeScreening } from "@/lib/screening";
import { registerSuccessPath } from "@/lib/auth/workerSession";
import { readApplicationResult } from "@/lib/applications/clientResult";

export function RegisterForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const role = (params.get("role") || "").toUpperCase();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [defaultFirstName, setDefaultFirstName] = useState("");
  const [defaultLastName, setDefaultLastName] = useState("");
  const [defaultPhone, setDefaultPhone] = useState("");

  const applyTrack = role === "MAN" ? "MAN" : role === "WOMAN" ? "WOMAN" : "";

  useEffect(() => {
    const screening = readScreening();
    const screeningName = (screening?.name || "").trim();
    setDefaultFirstName(screeningName.split(" ")[0] || "");
    setDefaultLastName(screeningName.split(" ").slice(1).join(" ") || "");
    setDefaultPhone(screening?.phone || "");
  }, []);

  const title = useMemo(
    () =>
      applyTrack === "MAN"
        ? t.apply.men.title
        : applyTrack === "WOMAN"
          ? t.apply.women.title
          : t.platform.auth.register,
    [applyTrack, t]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: String(form.get("firstName") || ""),
          lastName: String(form.get("lastName") || ""),
          email: String(form.get("email") || ""),
          phone: String(form.get("phone") || defaultPhone || ""),
          track: applyTrack || undefined,
        }),
      });
      const result = await readApplicationResult(response);
      if (!result.ok) {
        setError(result.error || t.form.submitError);
        return;
      }
    } catch {
      setError(t.form.submitError);
      return;
    } finally {
      setSending(false);
    }
    writeScreening({
      track: applyTrack === "MAN" ? "MAN" : applyTrack === "WOMAN" ? "WOMAN" : undefined,
    });
    router.push(registerSuccessPath(applyTrack));
  }

  return (
    <AuthCard title={title} eyebrow={t.platform.auth.register}>
        <form key={`${defaultFirstName}|${defaultLastName}|${defaultPhone}`} onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className={labelClass}>{t.platform.auth.firstName}</span>
          <input
            required
            name="firstName"
            autoComplete="given-name"
            defaultValue={defaultFirstName}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>{t.platform.auth.lastName}</span>
          <input
            required
            name="lastName"
            autoComplete="family-name"
            defaultValue={defaultLastName}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>{t.platform.auth.email}</span>
          <input required type="email" name="email" autoComplete="email" className={fieldClass} />
        </label>
        {defaultPhone ? (
          <label className="block">
            <span className={labelClass}>{t.platform.application.phone}</span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={defaultPhone}
              className={fieldClass}
            />
          </label>
        ) : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button type="submit" disabled={sending} className={goldButtonClass}>
          {t.form.submit}
        </button>
      </form>
      <p className="mt-6 text-sm text-ivory/50">
        {t.platform.auth.hasAccount}{" "}
        <Link href="/login" className="text-gold">
          {t.platform.auth.login}
        </Link>
      </p>
    </AuthCard>
  );
}
