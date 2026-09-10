import type { Metadata } from "next";
import { Inter, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "QbD Preformulation Research Assistant",
  description: "Decision-support workspace for Quality by Design preformulation research."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
