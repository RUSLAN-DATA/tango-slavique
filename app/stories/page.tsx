import type { Metadata } from "next";
import { StubPage } from "@/components/legal/StubPage";

export const metadata: Metadata = {
  title: "Stories — Tango Slavique",
  description: "Selected introductions from the private circle of Tango Slavique.",
};

export default function StoriesPage() {
  return <StubPage pageKey="stories" />;
}
