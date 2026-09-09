import type { Metadata } from "next";
import {
  LegalDocument,
  legalSectionTitle,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Terms & Conditions — Tango Slavique",
  description:
    "Membership terms of Tango Slavique, operated by Tango Global Group SL: admission, fees, verification, and confidentiality.",
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms & Conditions">
      <p>
        These Terms & Conditions govern membership of Tango Slavique, a
        private introduction club operated by Tango Global Group SL. By
        submitting an application, attending an interview, or paying any fee,
        you agree to this document.
      </p>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>1. Membership</h2>
        <p>
          Tango Slavique is a closed club. Membership is not automatic and is
          granted only after a personal review. We reserve the right to accept
          or decline any application without obligation to disclose the
          internal reasons for that decision, except where the law requires
          otherwise.
        </p>
        <p>
          Membership is personal, non-transferable, and intended solely for
          sincere introductions. It does not confer any ownership interest in the
          club, its brand, or its records.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>2. Eligibility, interview, and verification</h2>
        <p>
          Admission is limited to adults of at least 18 years of age. Each
          applicant must complete a written questionnaire, a personal interview
          with the club team, and identity verification before any introduction
          is arranged.
        </p>
        <p>
          You confirm that the information you provide is accurate and current.
          Misrepresentation, use of another person&apos;s identity, or
          concealment of facts material to a match may result in immediate
          exclusion without refund of fees already due.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>3. Fees (gentlemen)</h2>
        <p>
          For gentlemen, membership is subject to the following fees, unless
          a written variation is confirmed by the club:
        </p>
        <ul className="space-y-2">
          <li>
            <span className="text-zinc-100">Enrolment fee:</span> €1,000,
            payable upon invitation to proceed after initial review. This
            covers administrative screening, the personal assessment of your
            questionnaire, and the interview process.
          </li>
          <li>
            <span className="text-zinc-100">Monthly membership:</span> €400 per
            month, payable in advance, for continued access to introductions
            and club coordination.
          </li>
        </ul>
        <p>
          Fees for other categories of membership, where they apply, are
          confirmed privately during the interview. Refund conditions are set
          out in the Refund Policy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>4. Confidentiality (NDA)</h2>
        <p>
          You undertake a strict obligation of non-disclosure. You must not
          reveal the identity, photographs, contact details, personal
          circumstances, or even the membership of any other resident or
          applicant, except with that person&apos;s express consent or where
          the law requires disclosure.
        </p>
        <p>
          This duty survives the end of your membership. A breach may result
          in immediate exclusion, a ban from future admission, and any
          further remedies available under Spanish and EU law.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>5. Contact</h2>
        <p>
          Questions about these terms may be sent to{" "}
          <a
            href="mailto:tangoslavique@gmail.com"
            className="text-zinc-200 transition-colors hover:text-amber-300"
          >
            tangoslavique@gmail.com
          </a>
          .
        </p>
      </section>
    </LegalDocument>
  );
}
