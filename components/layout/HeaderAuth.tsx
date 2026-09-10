"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { ghostButtonClass } from "@/components/ui/formStyles";

type SessionUser = {
  id: string;
  role: string;
  emailVerified: boolean;
  firstName: string;
};

type HeaderAuthProps = {
  className?: string;
};

export function HeaderAuth({ className = "" }: HeaderAuthProps) {
  const { t } = useLanguage();
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((data: { user?: SessionUser | null }) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) {
    return null;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={
          className ||
          "hidden text-[11px] uppercase tracking-[0.18em] text-ivory/70 transition-colors hover:text-gold sm:inline-flex"
        }
      >
        {t.header.login}
      </Link>
    );
  }

  return (
    <Link
      href={user.role === "ADMIN" || user.role === "MATCHMAKER" ? "/admin" : "/account"}
      className={className || `hidden sm:inline-flex ${ghostButtonClass} !px-4 !py-2`}
    >
      {t.header.account}
    </Link>
  );
}
