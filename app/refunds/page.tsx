import type { Metadata } from "next";
import {
  LegalDocument,
  legalSectionTitle,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Refund Policy — Tango Slavique",
  description:
    "Refund policy of Tango Slavique: the €1,000 enrolment fee and €400 monthly membership operated by Tango Global Group SL.",
};

export default function RefundsPage() {
  return (
    <LegalDocument title="Refund Policy">
      <p>
        This Refund Policy applies to fees paid to Tango Global Group SL in
        connection with Tango Slavique. It should be read together with the
        Terms & Conditions.
      </p>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>1. Enrolment fee (€1,000)</h2>
        <p>
          The registration / enrolment fee of €1,000 covers the
          administrative verification of your application and the personal
          assessment of your questionnaire by the club team. Once the
          interview process has begun, this fee is not refundable.
        </p>
        <p>
          If the club declines an application before the interview has started,
          any enrolment fee already received will be returned, less only those
          charges that a payment provider may retain.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>2. Monthly membership (€400)</h2>
        <p>
          The monthly subscription of €400 may be cancelled at any time. To
          avoid the next charge, notice must reach the club at least seven
          (7) days before the following payment date.
        </p>
        <p>
          A month already paid is not prorated except where Spanish consumer
          law expressly requires otherwise. Cancellation ends further
          introductions from the close of the paid period.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>3. How to cancel or request a refund</h2>
        <p>
          Write to{" "}
          <a
            href="mailto:tangoslavique@gmail.com"
            className="text-zinc-200 transition-colors hover:text-amber-300"
          >
            tangoslavique@gmail.com
          </a>{" "}
          with the name used on your application. The club team will confirm
          the next billing date or, where a refund is due, the method and
          timing of return.
        </p>
      </section>
    </LegalDocument>
  );
}
