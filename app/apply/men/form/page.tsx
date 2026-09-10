import type { Metadata } from "next";
import { DetailedApplicationForm } from "@/components/apply/DetailedApplicationForm";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Confidential application — Tango Slavique",
  robots: { index: false, follow: false },
};

export default function MenApplicationFormPage() {
  return (
    <main className="min-h-screen bg-transparent pt-28">
      <Container className="py-12 md:py-16">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-400/80">
          Tango Slavique Man
        </p>
        <h1 className="mt-3 font-display text-3xl text-ivory sm:text-4xl">
          Confidential application
        </h1>
        <div className="mt-12">
          <DetailedApplicationForm track="MAN" />
        </div>
      </Container>
    </main>
  );
}
