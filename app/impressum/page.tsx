import type { Metadata } from "next";
import { LegalNoticeContent } from "@/components/legal/LegalNoticeContent";

export const metadata: Metadata = {
  title: "Legal notice — Tango Slavique",
  description: "Legal information for Tango Slavique.",
};

export default function ImpressumPage() {
  return <LegalNoticeContent />;
}
