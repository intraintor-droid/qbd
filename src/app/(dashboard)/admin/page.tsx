import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = createServerSupabase();
  const [{ count: userCount }, { count: projectCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }).is("deleted_at", null)
  ]);

  return (
    <div className="grid md:grid-cols-3 gap-4 pt-2">
      <Link href="/admin/users" className="border border-line bg-surface rounded-md p-4 hover:border-primary/50 transition-colors">
        <p className="text-xs text-ink/55">Total User</p>
        <p className="font-display text-3xl mt-1">{userCount ?? 0}</p>
        <p className="text-xs text-primary mt-2">Kelola user &amp; role →</p>
      </Link>
      <Link href="/admin/projects" className="border border-line bg-surface rounded-md p-4 hover:border-primary/50 transition-colors">
        <p className="text-xs text-ink/55">Total Proyek</p>
        <p className="font-display text-3xl mt-1">{projectCount ?? 0}</p>
        <p className="text-xs text-primary mt-2">Kelola semua proyek →</p>
      </Link>
      <Link href="/admin/appearance" className="border border-line bg-surface rounded-md p-4 hover:border-primary/50 transition-colors">
        <p className="text-xs text-ink/55">Tampilan Aplikasi</p>
        <p className="font-display text-lg mt-1">Nama, tagline, warna</p>
        <p className="text-xs text-primary mt-2">Ubah appearance →</p>
      </Link>
    </div>
  );
}
