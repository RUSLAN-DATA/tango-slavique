import type { Metadata } from "next";
import { StubPage } from "@/components/legal/StubPage";

export const metadata: Metadata = {
  title: "Support — Tango Slavique",
  description: "Private support for Tango Slavique membership.",
};

export default function SupportPage() {
  return <StubPage pageKey="support" />;
}
