"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

export function AuthCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-transparent pt-28">
      <Container className="max-w-lg py-16">
        {eyebrow ? (
          <p className="mb-3 text-[11px] font-medium uppercase tracking-brand text-gold">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-normal text-ivory sm:text-4xl">
          {title}
        </h1>
        <div className="mt-10 border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm sm:p-8">
          {children}
        </div>
        <Link
          href="/"
          className="mt-8 inline-block text-[11px] uppercase tracking-[0.18em] text-gold"
        >
          ← Tango Slavique
        </Link>
      </Container>
    </main>
  );
}
