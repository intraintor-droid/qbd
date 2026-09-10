import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      colors: {
        paper: "#FFF7FA",
        ink: "#241220",
        line: "#F1D9E6",
        primary: {
          DEFAULT: "var(--color-primary, #D6246F)",
          foreground: "var(--color-primary-foreground, #FFF7FA)",
          soft: "var(--color-primary-soft, #FCE4EF)",
          dark: "var(--color-primary-dark, #A81856)"
        },
        accent: {
          DEFAULT: "var(--color-accent, #FF6FA5)",
          soft: "var(--color-accent-soft, #FFE2EE)"
        },
        risk: {
          low: "#2F7D52",
          medium: "#C08B2E",
          high: "#D9622B",
          critical: "#B3123A"
        },
        info: "#7A3BC9",
        surface: "#FFFFFF"
      },
      borderRadius: { sm: "4px", md: "6px", lg: "10px" }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
export default config;
