"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { fieldClass, goldButtonClass, labelClass } from "@/components/ui/formStyles";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { writeScreening } from "@/lib/screening";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account";
  }
  return value;
}

export function RegisterForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const role = (params.get("role") || "").toUpperCase();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const applyTrack = role === "MAN" ? "MAN" : role === "WOMAN" ? "WOMAN" : "";

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
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        email: form.get("email"),
        password: form.get("password"),
        applyTrack: applyTrack || undefined,
        role: applyTrack,
        next,
      }),
    });
    const data = (await response.json()) as { error?: string; next?: string };
    setSending(false);
    if (!response.ok) {
      setError(data.error === "EMAIL_IN_USE" ? t.platform.auth.emailInUse : t.platform.auth.required);
      return;
    }
    writeScreening({ track: applyTrack === "MAN" ? "MAN" : applyTrack === "WOMAN" ? "WOMAN" : undefined });
    router.push("/verify-email");
  }

  return (
    <AuthCard title={title} eyebrow={t.platform.auth.register}>
      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className={labelClass}>{t.platform.auth.firstName}</span>
          <input required name="firstName" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>{t.platform.auth.lastName}</span>
          <input required name="lastName" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>{t.platform.auth.email}</span>
          <input required type="email" name="email" autoComplete="email" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>{t.platform.auth.password}</span>
          <input
            required
            type="password"
            name="password"
            minLength={8}
            autoComplete="new-password"
            className={fieldClass}
          />
          <span className="mt-2 block text-xs text-ivory/40">{t.platform.auth.passwordHint}</span>
        </label>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button type="submit" disabled={sending} className={goldButtonClass}>
          {t.platform.auth.continue}
        </button>
      </form>
      <p className="mt-6 text-sm text-ivory/50">
        {t.platform.auth.hasAccount}{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-gold">
          {t.platform.auth.login}
        </Link>
      </p>
    </AuthCard>
  );
}
