"use client";

import { FormEvent, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { fieldClass, goldButtonClass, labelClass } from "@/components/ui/formStyles";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    setSent(true);
  }

  return (
    <AuthCard title={t.platform.auth.forgot}>
      <p className="mb-6 text-sm font-light text-ivory-muted">{t.platform.auth.forgotBody}</p>
      {sent ? (
        <p className="text-sm text-gold">{t.platform.auth.forgotSent}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <label className="block">
            <span className={labelClass}>{t.platform.auth.email}</span>
            <input required type="email" name="email" className={fieldClass} />
          </label>
          <button type="submit" className={goldButtonClass}>
            {t.platform.auth.continue}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
