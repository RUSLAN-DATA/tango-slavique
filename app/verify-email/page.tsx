"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { goldButtonClass } from "@/components/ui/formStyles";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

function VerifyEmailInner() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [message, setMessage] = useState(t.platform.auth.verifyBody);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        if (!response.ok) {
          setError(true);
          setMessage(t.platform.auth.verifyError);
          return;
        }
        setMessage(t.platform.auth.verifySuccess);
        const session = await fetch("/api/auth/session").then((item) => item.json());
        const track = session.user?.applyTrack;
        const next =
          track === "MAN" ? "/apply/men/form" : track === "WOMAN" ? "/apply/women/form" : "/account";
        window.setTimeout(() => router.push(next), 800);
      })
      .catch(() => {
        setError(true);
        setMessage(t.platform.auth.verifyError);
      });
  }, [router, t.platform.auth.verifyError, t.platform.auth.verifySuccess, token]);

  return (
    <AuthCard title={t.platform.auth.verifyTitle}>
      <p className={`text-sm font-light leading-relaxed ${error ? "text-rose-300" : "text-ivory-muted"}`}>
        {message}
      </p>
      <button
        type="button"
        className={`${goldButtonClass} mt-8`}
        onClick={() => {
          void fetch("/api/auth/resend-verification", { method: "POST" });
        }}
      >
        {t.platform.auth.verifyCta}
      </button>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
