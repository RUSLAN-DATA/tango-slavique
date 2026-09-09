import type { Metadata } from "next";
import {
  LegalDocument,
  legalSectionTitle,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Law Enforcement & Compliance — Tango Slavique",
  description:
    "How Tango Global Group SL cooperates with Spanish and EU law-enforcement authorities on official judicial requests.",
};

export default function LawEnforcementPage() {
  return (
    <LegalDocument title="Law Enforcement & Compliance">
      <p>
        Tango Slavique, operated by Tango Global Group SL, protects the privacy
        of its members to the fullest extent permitted by law. We also
        cooperate with competent authorities when an official request is
        lawfully made.
      </p>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>1. Scope</h2>
        <p>
          This protocol applies to formal requests from law-enforcement
          authorities and courts of Spain and of the European Union, including
          judicial orders, warrants, and equivalent instruments issued under
          applicable Spanish or EU law.
        </p>
        <p>
          Informal, verbal, or incomplete requests are not sufficient. We
          will ask the requesting authority to provide a written instrument
          that identifies the legal basis, the data sought, and the
          authority competent to issue it.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>2. How we respond</h2>
        <p>
          Upon receipt of a valid judicial or statutory request, we will
          review it, disclose only the data strictly necessary to comply, and
          keep a record of the disclosure as required by law. Where the law
          allows us to notify the person concerned, we will do so unless the
          request lawfully prohibits notice.
        </p>
        <p>
          We do not provide bulk access to member files, nor do we volunteer
          information beyond what the instrument requires.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>3. Where to send a request</h2>
        <p>
          Official correspondence should be addressed to Tango Global Group
          SL, Travessera de Dalt 38, Entresuelo, 08024 Barcelona, Spain, and
          copied to{" "}
          <a
            href="mailto:tangoslavique@gmail.com"
            className="text-zinc-200 transition-colors hover:text-amber-300"
          >
            tangoslavique@gmail.com
          </a>{" "}
          with the subject line “Law enforcement request”.
        </p>
      </section>
    </LegalDocument>
  );
}
