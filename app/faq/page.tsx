import type { Metadata } from "next";
import { StubPage } from "@/components/legal/StubPage";

export const metadata: Metadata = {
  title: "FAQ — Tango Slavique",
  description: "Questions of admission to the Tango Slavique club.",
};

export default function FaqPage() {
  return <StubPage pageKey="faq" />;
}
