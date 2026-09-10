"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { fieldClass, goldButtonClass, labelClass } from "@/components/ui/formStyles";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

function ResetInner() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password: form.get("password"),
      }),
    });
    if (!response.ok) {
      setError(t.platform.auth.verifyError);
      return;
    }
    setDone(true);
  }

  return (
    <AuthCard title={t.platform.auth.reset}>
      {done ? (
        <p className="text-sm text-gold">
          {t.platform.auth.resetSuccess}{" "}
          <Link href="/login" className="underline">
            {t.platform.auth.login}
          </Link>
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <p className="text-sm font-light text-ivory-muted">{t.platform.auth.resetBody}</p>
          <label className="block">
            <span className={labelClass}>{t.platform.auth.password}</span>
            <input required minLength={8} type="password" name="password" className={fieldClass} />
          </label>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <button type="submit" className={goldButtonClass}>
            {t.platform.auth.reset}
          </button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetInner />
    </Suspense>
  );
}
