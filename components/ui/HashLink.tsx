"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

type GlowVariant = "none" | "solid" | "outline";

type HashLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
  glow?: GlowVariant;
};

const glowHover = {
  none: undefined,
  solid: {
    y: -2,
    boxShadow:
      "0 0 0 1px rgba(201, 165, 92, 0.55), 0 12px 32px rgba(201, 165, 92, 0.28)",
  },
  outline: {
    y: -2,
    boxShadow:
      "0 0 0 1px rgba(201, 165, 92, 0.7), 0 10px 28px rgba(201, 165, 92, 0.16)",
  },
};

export function HashLink({
  href,
  children,
  className,
  onNavigate,
  glow = "none",
}: HashLinkProps) {
  const pathname = usePathname();
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex + 1) : null;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!hash) {
      onNavigate?.();
      return;
    }

    if (pathname === "/") {
      event.preventDefault();
      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      window.history.replaceState(null, "", `#${hash}`);
      onNavigate?.();
    }
  }

  return (
    <motion.a
      href={href}
      className={className}
      onClick={handleClick}
      whileHover={glowHover[glow]}
      whileTap={glow === "none" ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.a>
  );
}
