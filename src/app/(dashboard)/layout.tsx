import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, institution")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex">
      <Sidebar role={profile?.role} />
      <div className="flex-1 min-w-0">
        <header className="h-14 border-b border-line bg-surface flex items-center justify-between px-6 sticky top-0 z-10">
          <p className="text-sm text-ink/60">
            {profile?.institution ?? "Institusi belum diatur"}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{profile?.full_name ?? user.email}</span>
            <span className="text-[11px] font-mono uppercase tracking-wide bg-primary-soft text-primary px-2 py-0.5 rounded-sm">
              {profile?.role ?? "researcher"}
            </span>
            <LogoutButton />
          </div>
        </header>
        <main className="p-6 max-w-7xl">{children}</main>
      </div>
    </div>
  );
}
