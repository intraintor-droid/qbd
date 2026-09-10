export interface AppSettings {
  app_name: string;
  tagline: string;
  hero_headline: string;
  hero_body: string;
  color_primary: string;
  color_primary_dark: string;
  color_primary_soft: string;
  color_accent: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  app_name: "QbD Preformulation",
  tagline: "Research Assistant",
  hero_headline: "Dari struktur molekul hingga risk assessment, dalam satu alur kerja.",
  hero_body:
    "Susun profil fisikokimia, telusuri literatur lintas sumber, dan bangun QTPP–CQA–CMA yang tertelusuri ke bukti ilmiahnya — sebelum Anda masuk ke tahap formulasi.",
  color_primary: "#D6246F",
  color_primary_dark: "#A81856",
  color_primary_soft: "#FCE4EF",
  color_accent: "#FF6FA5"
};
