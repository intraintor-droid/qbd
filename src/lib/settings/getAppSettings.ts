import { createServerSupabase } from "@/lib/supabase/server";
import { DEFAULT_APP_SETTINGS, type AppSettings } from "./types";

export type { AppSettings };
export { DEFAULT_APP_SETTINGS };

/**
 * Reads the singleton app_settings row. Falls back to hardcoded defaults
 * if the migration hasn't been run yet (table missing) or the row is
 * absent, so the app never breaks because of this optional feature.
 * SERVER-ONLY — do not import this from a "use client" file; import
 * from "./types" instead for the type/defaults.
 */
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase.from("app_settings").select("*").eq("id", true).single();
    if (error || !data) return DEFAULT_APP_SETTINGS;
    return {
      app_name: data.app_name,
      tagline: data.tagline,
      hero_headline: data.hero_headline,
      hero_body: data.hero_body,
      color_primary: data.color_primary,
      color_primary_dark: data.color_primary_dark,
      color_primary_soft: data.color_primary_soft,
      color_accent: data.color_accent
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}
