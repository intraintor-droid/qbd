import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { DeleteProjectButton } from "./DeleteProjectButton";

export default async function AdminProjectsPage() {
  const supabase = createServerSupabase();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, research_title, research_name, target_api, status, owner_id, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch owner names separately (simple approach, avoids needing a DB view/join type).
  const ownerIds = Array.from(new Set((projects ?? []).map((p) => p.owner_id)));
  const { data: owners } = ownerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ownerIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o.full_name ?? "—"]));

  return (
    <div className="pt-2">
      <p className="text-sm text-ink/55 mb-4">{projects?.length ?? 0} proyek dari seluruh user.</p>
      <table className="data-table w-full">
        <thead>
          <tr><th>Judul</th><th>Pemilik</th><th>API</th><th>Status</th><th>Dibuat</th><th></th></tr>
        </thead>
        <tbody>
          {(projects ?? []).map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/projects/${p.id}`} className="text-primary hover:underline">
                  {p.research_title}
                </Link>
                <p className="text-xs text-ink/45">{p.research_name}</p>
              </td>
              <td className="text-ink/60">{ownerMap.get(p.owner_id) ?? "—"}</td>
              <td className="text-ink/60">{p.target_api ?? "—"}</td>
              <td>
                <span className="text-[11px] font-mono uppercase text-ink/50">{p.status}</span>
              </td>
              <td className="text-ink/50 text-xs">
                {new Date(p.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })}
              </td>
              <td>
                <DeleteProjectButton projectId={p.id} projectTitle={p.research_title} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
