import Link from "next/link";
import type { ReactNode } from "react";

export const genderApplyClassName =
  "inline-flex items-center justify-center border border-amber-500/30 bg-white/5 px-8 py-3.5 font-serif text-xs uppercase tracking-widest text-ivory backdrop-blur-sm transition-all duration-500 hover:border-amber-400";

export function GenderApplyLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`${genderApplyClassName} ${className}`.trim()}>
      {children}
    </Link>
  );
}
