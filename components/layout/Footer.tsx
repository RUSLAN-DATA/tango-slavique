"use client";

import Link from "next/link";
import { HashLink } from "@/components/ui/HashLink";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

function isExternal(href: string) {
  return href.startsWith("mailto:") || href.startsWith("http");
}

function LinkRow({
  items,
  className,
}: {
  items: { href: string; label: string; hash?: boolean }[];
  className: string;
}) {
  return (
    <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:gap-x-4">
      {items.map((item, index) => (
        <span key={item.href} className="inline-flex items-center gap-3 sm:gap-4">
          {index > 0 ? (
            <span aria-hidden className="text-zinc-700">
              |
            </span>
          ) : null}
          {item.hash ? (
            <HashLink href={item.href} className={className}>
              {item.label}
            </HashLink>
          ) : isExternal(item.href) ? (
            <a href={item.href} className={className}>
              {item.label}
            </a>
          ) : (
            <Link href={item.href} className={className}>
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Footer() {
  const { t } = useLanguage();

  const nav = [
    { href: "/#club", label: t.footer.nav.about, hash: true },
    { href: "/#how-it-works", label: t.footer.nav.how, hash: true },
    { href: "/stories", label: t.footer.nav.stories },
    { href: "/blog", label: t.footer.nav.blog },
    { href: "/faq", label: t.footer.nav.faq },
  ];

  const legal = [
    { href: "/terms", label: t.footer.legalLinks.terms },
    { href: "/acceptable-use", label: t.footer.legalLinks.acceptable },
    { href: "/privacy-policy", label: t.footer.legalLinks.privacy },
    { href: "/refunds", label: t.footer.legalLinks.refunds },
    { href: "mailto:tangoslavique@gmail.com", label: t.footer.legalLinks.support },
    { href: "/law-enforcement", label: t.footer.legalLinks.law },
  ];

  return (
    <footer className="relative bg-transparent py-20 md:py-28">
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 text-center">
        <p className="font-serif text-2xl tracking-[0.28em] text-amber-200/90 sm:text-3xl">
          TANGO SLAVIQUE
        </p>
        <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-zinc-500">
          {t.footer.tagline}
        </p>

        <div className="mt-10">
          <LinkRow
            items={nav}
            className="text-xs uppercase tracking-widest text-zinc-400 transition-colors duration-300 hover:text-amber-400"
          />
        </div>
        <div className="mt-6">
          <LinkRow
            items={legal}
            className="text-xs uppercase tracking-widest text-zinc-500 transition-colors duration-300 hover:text-amber-400"
          />
        </div>

        <p className="mt-10 text-xs text-zinc-500">
          {t.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
