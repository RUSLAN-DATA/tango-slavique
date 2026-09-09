import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: "#070709",
        obsidian: {
          DEFAULT: "#070709",
          muted: "#0d0d11",
          surface: "#13131a",
          card: "#141414",
          elevated: "#1C1A1E",
        },
        gold: {
          DEFAULT: "#C9A55C",
          light: "#E8D5A3",
          dark: "#8B7340",
        },
        ivory: {
          DEFAULT: "#F0EBE3",
          muted: "rgba(240, 235, 227, 0.55)",
          faint: "rgba(240, 235, 227, 0.45)",
        },
        silver: {
          DEFAULT: "#A8A29E",
          muted: "#8A8580",
        },
        woman: {
          DEFAULT: "#8B3A4A",
          hover: "#A84858",
        },
        man: {
          DEFAULT: "#2A3A5C",
          hover: "#3A4E78",
        },
      },
      fontFamily: {
        display: [
          "var(--font-display)",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        serif: [
          "var(--font-display)",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        body: [
          "var(--font-body)",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      letterSpacing: {
        brand: "0.28em",
        headline: "0.08em",
      },
      backgroundImage: {
        "gold-border":
          "linear-gradient(180deg, rgba(201, 165, 92, 0.45), rgba(201, 165, 92, 0.08))",
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(201, 165, 92, 0.28)",
        "gold-glow":
          "0 0 0 1px rgba(201, 165, 92, 0.45), 0 10px 36px rgba(201, 165, 92, 0.16)",
        card: "0 24px 80px rgba(0, 0, 0, 0.45)",
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        700: "700ms",
      },
    },
  },
  plugins: [],
};

export default config;
