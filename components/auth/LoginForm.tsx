"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { fieldClass, goldButtonClass, labelClass } from "@/components/ui/formStyles";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/account";
  }
  return value;
}

export function LoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = (await response.json()) as { error?: string; role?: string; emailVerified?: boolean };
    setSending(false);
    if (!response.ok) {
      setError(t.platform.auth.invalid);
      return;
    }
    if (data.role === "ADMIN" || data.role === "MATCHMAKER") {
      router.push("/admin");
      return;
    }
    if (!data.emailVerified) {
      router.push("/verify-email");
      return;
    }
    router.push(next);
  }

  return (
    <AuthCard title={t.platform.auth.login} eyebrow="Tango Slavique">
      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className={labelClass}>{t.platform.auth.email}</span>
          <input required type="email" name="email" autoComplete="email" className={fieldClass} />
        </label>
        <label className="block">
          <span className={labelClass}>{t.platform.auth.password}</span>
          <input required type="password" name="password" autoComplete="current-password" className={fieldClass} />
        </label>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button type="submit" disabled={sending} className={goldButtonClass}>
          {t.platform.auth.login}
        </button>
      </form>
      <p className="mt-6 text-sm text-ivory/50">
        <Link href="/forgot-password" className="text-gold">
          {t.platform.auth.forgot}
        </Link>
      </p>
      <p className="mt-3 text-sm text-ivory/50">
        {t.platform.auth.noAccount}{" "}
        <Link href="/register" className="text-gold">
          {t.platform.auth.register}
        </Link>
      </p>
    </AuthCard>
  );
}
