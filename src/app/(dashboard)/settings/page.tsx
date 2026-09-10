import { createServerSupabase } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id ?? "").single();

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <p className="font-mono text-xs text-primary">Account</p>
        <h1 className="font-display text-2xl mt-1">Pengaturan</h1>
      </div>
      <div className="border border-line bg-surface rounded-md p-4 text-sm space-y-2">
        <p><span className="text-ink/55">Nama:</span> {profile?.full_name ?? "—"}</p>
        <p><span className="text-ink/55">Email:</span> {user?.email}</p>
        <p><span className="text-ink/55">Institusi:</span> {profile?.institution ?? "—"}</p>
        <p><span className="text-ink/55">Peran:</span> <span className="font-mono">{profile?.role}</span></p>
      </div>
      <p className="text-xs text-ink/45">
        Manajemen pengguna, konfigurasi AI provider, dan audit trail (spec bagian 31, 33, 43) untuk peran
        super_admin akan ditambahkan pada iterasi berikutnya.
      </p>
    </div>
  );
}
