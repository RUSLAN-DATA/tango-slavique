import Link from "next/link";
import type { ReactNode } from "react";

export const legalSectionTitle =
  "text-xs font-semibold tracking-widest text-amber-400 uppercase";

export function CompanyDetails({ className = "" }: { className?: string }) {
  return (
    <p className={className}>
      Tango Global Group SL | Tax ID: B88657085 | Travessera de Dalt 38,
      Entresuelo, 08024 Barcelona, Spain | Email:{" "}
      <a
        href="mailto:tangoslavique@gmail.com"
        className="text-zinc-400 transition-colors hover:text-amber-300"
      >
        tangoslavique@gmail.com
      </a>{" "}
      | Tel:{" "}
      <a
        href="tel:+34671732883"
        className="text-zinc-400 transition-colors hover:text-amber-300"
      >
        +34 671 732 883
      </a>
      .
    </p>
  );
}

export function LegalDocument({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-20 pt-28 text-sm leading-relaxed text-zinc-300 sm:pt-32 sm:text-base">
        <Link
          href="/"
          className="inline-block text-xs text-zinc-400 transition-colors hover:text-amber-300"
        >
          ← Back to Home
        </Link>

        <header className="space-y-3">
          <h1 className="font-serif text-3xl text-white sm:text-4xl">
            {title}
          </h1>
          <p className="text-xs uppercase tracking-widest text-amber-400/80">
            LAST UPDATED: 28 JULY 2026
          </p>
          <CompanyDetails className="text-xs leading-relaxed text-zinc-500" />
        </header>

        {children}

        <footer className="border-t border-white/5 pt-8">
          <CompanyDetails className="text-xs leading-relaxed text-zinc-500" />
        </footer>
      </div>
    </main>
  );
}
