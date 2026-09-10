import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/matches", label: "Matches" },
  { href: "/admin/introductions", label: "Introductions" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/payments", label: "Payments" },
];

export function AdminShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-transparent pt-28">
      <Container className="py-12 md:py-16">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-400/80">
          House desk
        </p>
        <h1 className="mt-3 font-display text-3xl text-ivory sm:text-4xl">{title}</h1>
        <nav className="mt-8 flex flex-wrap gap-2 border-b border-white/[0.06] pb-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-ivory/50 transition-colors hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-10">{children}</div>
      </Container>
    </main>
  );
}
