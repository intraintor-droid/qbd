import { createServerSupabase } from "@/lib/supabase/server";
import { RoleSelect } from "./RoleSelect";

export default async function AdminUsersPage() {
  const supabase = createServerSupabase();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, institution, role, created_at")
    .order("created_at", { ascending: false });

  const {
    data: { user: currentUser }
  } = await supabase.auth.getUser();

  return (
    <div className="pt-2">
      <p className="text-sm text-ink/55 mb-4">{users?.length ?? 0} user terdaftar.</p>
      <table className="data-table w-full">
        <thead>
          <tr><th>Nama</th><th>Institusi</th><th>Role</th><th>Terdaftar</th></tr>
        </thead>
        <tbody>
          {(users ?? []).map((u) => (
            <tr key={u.id}>
              <td>{u.full_name ?? "—"}</td>
              <td className="text-ink/60">{u.institution ?? "—"}</td>
              <td>
                <RoleSelect userId={u.id} currentRole={u.role} disabled={u.id === currentUser?.id} />
              </td>
              <td className="text-ink/50 text-xs">
                {new Date(u.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-ink/40 mt-3">
        Anda tidak bisa mengubah role akun Anda sendiri dari sini (mencegah terkunci tidak sengaja).
      </p>
    </div>
  );
}
