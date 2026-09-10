import { createServerSupabase } from "@/lib/supabase/server";
import { DEFAULT_APP_SETTINGS } from "@/lib/settings/getAppSettings";
import { AppearanceForm } from "./AppearanceForm";

export default async function AdminAppearancePage() {
  const supabase = createServerSupabase();
  const { data } = await supabase.from("app_settings").select("*").eq("id", true).single();

  const settings = data ?? DEFAULT_APP_SETTINGS;

  return (
    <div className="pt-2 max-w-2xl">
      <p className="text-sm text-ink/55 mb-6">
        Perubahan di sini langsung berlaku ke seluruh aplikasi (dashboard, sidebar, halaman login/daftar)
        untuk semua user — tanpa perlu deploy ulang.
      </p>
      <AppearanceForm initial={settings} />
    </div>
  );
}
