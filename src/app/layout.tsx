import type { Metadata } from "next";
import { Inter, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { getAppSettings } from "@/lib/settings/getAppSettings";
import { AppSettingsProvider } from "@/lib/settings/AppSettingsContext";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "QbD Preformulation Research Assistant",
  description: "Decision-support workspace for Quality by Design preformulation research."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getAppSettings();

  // Injected as inline CSS custom properties so appearance changes made by
  // super_admin in /admin/appearance take effect immediately — no rebuild
  // or redeploy needed. Tailwind's primary/accent utilities read these vars
  // (see tailwind.config.ts), with the hex literals there as fallback only.
  const themeVars = `:root{
    --color-primary: ${settings.color_primary};
    --color-primary-dark: ${settings.color_primary_dark};
    --color-primary-soft: ${settings.color_primary_soft};
    --color-accent: ${settings.color_accent};
  }`;

  return (
    <html lang="id" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeVars }} />
      </head>
      <body className="font-sans">
        <AppSettingsProvider settings={settings}>{children}</AppSettingsProvider>
      </body>
    </html>
  );
}
