"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const userLinks = [
  { href: "/account", key: "overview" },
  { href: "/account/application", key: "application" },
  { href: "/account/profile", key: "profile" },
  { href: "/account/matches", key: "matches" },
  { href: "/account/introductions", key: "introductions" },
  { href: "/account/notifications", key: "notifications" },
  { href: "/account/settings", key: "settings" },
] as const;

export function AccountShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-transparent pt-28">
      <Container className="py-12 md:py-16">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-400/80">
          {t.platform.account.title}
        </p>
        <h1 className="mt-3 font-display text-3xl text-ivory sm:text-4xl">{title}</h1>
        <nav className="mt-8 flex flex-wrap gap-2 border-b border-white/[0.06] pb-4">
          {userLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  active ? "text-gold" : "text-ivory/50 hover:text-gold"
                }`}
              >
                {t.platform.account[link.key]}
              </Link>
            );
          })}
        </nav>
        <div className="mt-10">{children}</div>
      </Container>
    </main>
  );
}
