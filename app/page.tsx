import { ClubIntro } from "@/components/home/ClubIntro";
import { ApplySection } from "@/components/home/ApplySection";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Philosophy } from "@/components/home/Philosophy";
import { Privacy } from "@/components/home/Privacy";

export default function HomePage() {
  return (
    <main className="bg-transparent">
      <Hero />
      <ClubIntro />
      <Philosophy />
      <HowItWorks />
      <Privacy />
      <ApplySection />
    </main>
  );
}
