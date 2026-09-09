import type { Metadata } from "next";
import {
  LegalDocument,
  legalSectionTitle,
} from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Acceptable Use Policy — Tango Slavique",
  description:
    "Acceptable use of Tango Slavique: respect, privacy of meetings, and prohibition of commercial use.",
};

export default function AcceptableUsePage() {
  return (
    <LegalDocument title="Acceptable Use Policy">
      <p>
        Tango Slavique exists for sincere, discreet introductions. These
        standards apply to every applicant, resident, guest, and
        correspondence with the club.
      </p>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>1. Conduct</h2>
        <p>
          You will treat the club team and every other resident with respect.
          Harassment, pressure, misrepresentation, or any conduct that
          undermines the safety or dignity of another person is forbidden.
        </p>
        <p>
          Meetings arranged by the club are private. You must not photograph,
          record, livestream, or otherwise capture a meeting, conversation, or
          another resident without their prior written consent.
        </p>
        <p>
          The club may not be used for commercial solicitation, recruitment,
          publicity, journalism, or any business purpose unrelated to a
          genuine personal introduction.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>2. Privacy of other residents</h2>
        <p>
          A breach of another resident&apos;s privacy — including sharing a
          name, image, contact detail, or the fact of their membership — will
          result in immediate blocking of your membership, without refund of
          fees already due, and a ban from future admission.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={legalSectionTitle}>3. Reports</h2>
        <p>
          Concerns may be sent in confidence to{" "}
          <a
            href="mailto:tangoslavique@gmail.com"
            className="text-zinc-200 transition-colors hover:text-amber-300"
          >
            tangoslavique@gmail.com
          </a>
          . The club will act promptly to protect residents.
        </p>
      </section>
    </LegalDocument>
  );
}
