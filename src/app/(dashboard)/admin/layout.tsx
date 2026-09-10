import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/appearance", label: "Appearance" }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-primary">Admin Panel</p>
        <h1 className="font-display text-2xl mt-1">Kelola Aplikasi</h1>
        <p className="text-sm text-ink/55 mt-1">
          Khusus super_admin — kelola user, proyek, dan tampilan aplikasi.
        </p>
      </div>
      <div className="flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="px-3.5 py-2 text-sm text-ink/60 hover:text-primary border-b-2 border-transparent hover:border-primary/40 -mb-px transition-colors"
          >
            {t.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
