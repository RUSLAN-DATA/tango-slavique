import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { CelestialDust } from "@/components/CelestialDust";
import { FilmGrain } from "@/components/FilmGrain";
import { ChatWidget } from "@/components/ChatWidget";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tango Slavique | Exclusive Matchmaking & Private Circle",
  description:
    "Private matchmaking house in Barcelona and across Europe for discerning individuals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorantGaramond.variable} ${inter.variable} font-body bg-[#070709] text-ivory antialiased`}
      >
        <CelestialDust />
        <LanguageProvider>
          <div className="relative z-10 bg-transparent">
            <Header />
            {children}
            <Footer />
          </div>
          <ChatWidget />
        </LanguageProvider>
        <FilmGrain />
      </body>
    </html>
  );
}
