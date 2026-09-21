import type { Metadata } from "next";
import { FaqList } from "@/components/faq/FaqList";

export const metadata: Metadata = {
  title: "FAQ — Tango Slavique",
  description: "Questions of admission to the Tango Slavique club.",
};

export default function FaqPage() {
  return <FaqList />;
}
