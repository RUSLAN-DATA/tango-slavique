import type { Metadata } from "next";
import { ApplyTrackPage } from "@/components/apply/ApplyTrackPage";

export const metadata: Metadata = {
  title: "Apply as a Tango Slavique Woman | Tango Slavique",
  description:
    "Complimentary membership by selection. Complete anonymity and personal matching among verified gentlemen.",
};

export default function WomenApplyPage() {
  return <ApplyTrackPage track="women" />;
}
