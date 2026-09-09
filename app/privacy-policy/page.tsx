import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy — Tango Slavique",
  description:
    "Full privacy policy of Tango Slavique (Tango Global Group SL) under GDPR, LOPDGDD and AEPD guidance: legal basis, retention, international transfers and your rights.",
};

const heading = "font-serif text-xl text-amber-200 sm:text-2xl";
const subheading =
  "text-xs tracking-widest uppercase text-amber-400/80";

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument title="Privacy Policy">
      <p>
        At TangoSlavique we respect your privacy and are committed to
        protecting your personal data. This policy explains what information we
        collect, the legal bases on which we process it, how long we keep it,
        whether it is transferred outside the European Economic Area, and how
        you can exercise your rights under Regulation (EU) 2016/679 (GDPR) and
        Spanish Organic Law 3/2018 on data protection and the guarantee of
        digital rights (LOPDGDD).
      </p>

      <section className="space-y-4">
        <h2 className={heading}>1. Data controller</h2>
        <p className={subheading}>Identity of the controller</p>
        <ul className="space-y-2">
          <li>
            <span className="text-zinc-400">Operator:</span> Tango Global Group
            SL
          </li>
          <li>
            <span className="text-zinc-400">Tax ID:</span> B88657085
          </li>
          <li>
            <span className="text-zinc-400">Registered office:</span>{" "}
            Travessera de Dalt 38, Entresuelo, 08024 Barcelona, Spain
          </li>
          <li>
            <span className="text-zinc-400">Email:</span>{" "}
            <a
              href="mailto:tangoslavique@gmail.com"
              className="text-zinc-200 transition-colors hover:text-amber-300"
            >
              tangoslavique@gmail.com
            </a>
          </li>
          <li>
            <span className="text-zinc-400">Telephone:</span>{" "}
            <a
              href="tel:+34671732883"
              className="text-zinc-200 transition-colors hover:text-amber-300"
            >
              +34 671 732 883
            </a>
          </li>
          <li>
            <span className="text-zinc-400">Website:</span>{" "}
            <a
              href="https://tangoslavique.com"
              className="text-zinc-200 transition-colors hover:text-amber-300"
            >
              tangoslavique.com
            </a>
          </li>
        </ul>
        <p>
          Tango Global Group SL is the data controller for personal data
          processed through Tango Slavique. We process your data in accordance
          with the GDPR, the LOPDGDD, and the guidance of the Agencia Española
          de Protección de Datos (AEPD).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={heading}>2. What data we process</h2>
        <p className={subheading}>Categories of personal data</p>
        <p>
          We collect only the data necessary to provide our matchmaking
          service and organise our blind date events:
        </p>
        <ul className="space-y-3">
          <li>
            <span className="text-zinc-100">Account data:</span> name, email
            address, phone number, registration date, verification status.
          </li>
          <li>
            <span className="text-zinc-100">Profile preferences:</span> matching
            criteria, goals, and compatibility details.
          </li>
          <li>
            <span className="text-zinc-100">Confidentiality clause:</span>{" "}
            profile details, personal answers, and media are strictly private,
            never shared with third parties for their own purposes, and never
            indexed in search engines.
          </li>
        </ul>
        <p>
          We do not publish member catalogues. Photographs and interview notes,
          where provided, are used solely to arrange private introductions.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={heading}>3. Legal basis</h2>
        <p className={subheading}>Consent &amp; contractual necessity</p>
        <p>
          We process personal data only where a lawful basis under Article 6
          GDPR applies:
        </p>
        <ul className="space-y-3">
          <li>
            <span className="text-zinc-100">Consent (Art. 6(1)(a) GDPR):</span>{" "}
            you tick the consent box on the application form and thereby
            accept this Privacy Policy and the confidential processing of your
            details. You may withdraw consent at any time by writing to{" "}
            <a
              href="mailto:tangoslavique@gmail.com"
              className="text-zinc-200 transition-colors hover:text-amber-300"
            >
              tangoslavique@gmail.com
            </a>
            . Withdrawal does not affect the lawfulness of processing carried
            out before withdrawal.
          </li>
          <li>
            <span className="text-zinc-100">
              Contractual necessity (Art. 6(1)(b) GDPR):
            </span>{" "}
            once you apply for membership, we process the data required to
            review your application, verify identity, conduct the interview,
            administer fees, and arrange introductions. Without this data we
            cannot perform the service.
          </li>
          <li>
            <span className="text-zinc-100">
              Legal obligation (Art. 6(1)(c) GDPR):
            </span>{" "}
            we may retain certain records where Spanish or EU law requires it
            (for example, invoicing and anti-money-laundering checks, where
            applicable).
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className={heading}>4. Data retention</h2>
        <p className={subheading}>Storage limitation</p>
        <p>
          We keep personal data only for as long as needed for the purposes
          described in this policy:
        </p>
        <ul className="space-y-3">
          <li>
            Data of inactive applicants or former members is deleted or
            irreversibly anonymised after{" "}
            <span className="text-zinc-100">twelve (12) months</span> of
            inactivity, unless a longer period is required by law.
          </li>
          <li>
            Upon a valid request to erase your data (right to be forgotten),
            we will delete your profile and related records{" "}
            <span className="text-zinc-100">without undue delay</span>, and in
            any event as soon as technically practicable, except where we must
            retain a limited subset to comply with a legal obligation or to
            establish, exercise or defend legal claims.
          </li>
          <li>
            Active members’ data is retained for the duration of membership
            and for the inactivity period above after membership ends.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className={heading}>5. International transfers &amp; infrastructure</h2>
        <p className={subheading}>SCC compliance</p>
        <p>
          Our primary operations and filing systems are based in Spain, within
          the European Economic Area (EEA). Some service providers that host
          email, cloud infrastructure or communications may process data
          outside the EEA.
        </p>
        <p>
          Where personal data is transferred to a country that the European
          Commission has not recognised as providing an adequate level of
          protection, we rely on the European Commission’s Standard
          Contractual Clauses (SCCs), together with any supplementary measures
          required by the Schrems II case law and AEPD guidance, to ensure that
          your data remains protected to a GDPR-equivalent standard.
        </p>
        <p>
          You may request a copy of the relevant transfer safeguards by writing
          to{" "}
          <a
            href="mailto:tangoslavique@gmail.com"
            className="text-zinc-200 transition-colors hover:text-amber-300"
          >
            tangoslavique@gmail.com
          </a>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className={heading}>6. Your rights</h2>
        <p className={subheading}>GDPR / LOPDGDD &amp; the AEPD</p>
        <p>
          You may exercise the following rights by contacting us at{" "}
          <a
            href="mailto:tangoslavique@gmail.com"
            className="text-zinc-200 transition-colors hover:text-amber-300"
          >
            tangoslavique@gmail.com
          </a>
          , attaching sufficient information for us to identify you:
        </p>
        <ul className="space-y-2">
          <li>
            <span className="text-zinc-100">Access</span> — to obtain
            confirmation of whether we process your data and a copy of it.
          </li>
          <li>
            <span className="text-zinc-100">Rectification</span> — to correct
            inaccurate or incomplete data.
          </li>
          <li>
            <span className="text-zinc-100">Erasure</span> — the right to be
            forgotten, as described in Section 4.
          </li>
          <li>
            <span className="text-zinc-100">Restriction</span> — to limit
            processing in the cases set out in Article 18 GDPR.
          </li>
          <li>
            <span className="text-zinc-100">Portability</span> — to receive data
            you provided to us in a structured, commonly used, machine-readable
            format, where processing is based on consent or contract and is
            carried out by automated means.
          </li>
          <li>
            <span className="text-zinc-100">Objection</span> — to object to
            processing based on legitimate interests, where that basis applies.
          </li>
          <li>
            <span className="text-zinc-100">Withdrawal of consent</span> — at
            any time, without affecting prior processing.
          </li>
        </ul>
        <p>
          We will respond within one month of receipt, extendable by two
          further months where the request is complex, in accordance with
          Article 12 GDPR.
        </p>
        <p>
          If you consider that we have not handled your data in accordance
          with the law, you have the right to lodge a complaint with the
          Spanish supervisory authority, the Agencia Española de Protección de
          Datos (AEPD), at{" "}
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-300 underline underline-offset-4 transition-colors hover:text-amber-200"
          >
            www.aepd.es
          </a>
          , or at C/ Jorge Juan, 6, 28001 Madrid, Spain.
        </p>
      </section>
    </LegalDocument>
  );
}
