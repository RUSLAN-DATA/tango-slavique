"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HashLink } from "@/components/ui/HashLink";
import { Logo } from "@/components/ui/Logo";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const ease = [0.22, 1, 0.36, 1] as const;

export function Header() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: "/#club", label: t.header.nav.club },
    { href: "/#how-it-works", label: t.header.nav.how },
    { href: "/#advantages", label: t.header.nav.advantages },
    { href: "/#privacy", label: t.header.nav.privacy },
    { href: "/blog", label: t.header.nav.blog },
    { href: "/#contact", label: t.header.nav.contact },
  ];

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-[#070709]/80 backdrop-blur-md transition-all duration-500">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6 lg:px-8">
        <Link href="/" className="relative z-10 shrink-0" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-5 xl:flex 2xl:gap-7">
          {navItems.map((item) => (
            <HashLink
              key={item.href}
              href={item.href}
              className="text-[11px] font-medium uppercase tracking-[0.18em] text-ivory/70 transition-colors duration-300 hover:text-gold"
            >
              {item.label}
            </HashLink>
          ))}
        </nav>

        <div className="relative z-10 flex shrink-0 items-center gap-3 sm:gap-4">
          <HashLink
            href="/#contact"
            className="hidden border border-amber-400/40 px-5 py-2 text-xs uppercase tracking-[0.2em] text-amber-200 transition-all duration-500 hover:border-amber-300 hover:bg-amber-400/10 hover:text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] sm:inline-flex"
          >
            {t.header.apply}
          </HashLink>
          <LanguageSwitcher />
          <motion.button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center text-ivory xl:hidden"
            aria-expanded={open}
            aria-label={open ? t.header.closeMenu : t.header.openMenu}
            onClick={() => setOpen((current) => !current)}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "close" : "menu"}
                initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                transition={{ duration: 0.22, ease }}
                className="inline-flex"
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.48, ease }}
            className="absolute inset-x-0 top-16 bottom-0 overflow-hidden bg-[#070709]/95 backdrop-blur-md sm:top-[72px] xl:hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="flex h-full flex-col px-4 sm:px-6"
            >
              <nav className="flex flex-col gap-1 pt-6">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ delay: 0.06 * index, duration: 0.42, ease }}
                  >
                    <HashLink
                      href={item.href}
                      onNavigate={() => setOpen(false)}
                      className="block py-4 font-display text-2xl text-ivory sm:text-3xl"
                    >
                      {item.label}
                    </HashLink>
                  </motion.div>
                ))}
              </nav>
              <HashLink
                href="/#contact"
                onNavigate={() => setOpen(false)}
                className="mt-8 border border-amber-400/40 px-5 py-2 text-center text-xs uppercase tracking-[0.2em] text-amber-200 transition-all duration-500 hover:border-amber-300 hover:bg-amber-400/10 hover:text-white hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]"
              >
                {t.header.apply}
              </HashLink>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
