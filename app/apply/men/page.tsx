import type { Metadata } from "next";
import { ApplyTrackPage } from "@/components/apply/ApplyTrackPage";

export const metadata: Metadata = {
  title: "Tango Slavique Man | Tango Slavique",
  description:
    "Private matchmaking, tailored introductions, complete discretion. €1,000 enrollment + €400 monthly.",
};

export default function MenApplyPage() {
  return <ApplyTrackPage track="men" />;
}
