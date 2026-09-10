import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const supabase = createServerSupabase();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, research_name, research_title, target_api, dosage_form, status, updated_at")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-primary">Workspace</p>
          <h1 className="font-display text-2xl mt-1">Proyek Penelitian</h1>
        </div>
        <Link href="/projects/new" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
          + Proyek Baru
        </Link>
      </div>

      {(!projects || projects.length === 0) && (
        <div className="border border-dashed border-line rounded-md p-10 text-center">
          <p className="text-sm text-ink/60">Belum ada proyek. Mulai studi preformulasi pertama Anda.</p>
          <Link href="/projects/new" className="inline-block mt-3 text-sm text-primary underline">
            Buat proyek baru
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {(projects ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="border border-line bg-surface rounded-md p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <p className="font-display text-lg leading-snug">{p.research_title}</p>
              <span className="text-[11px] font-mono uppercase text-ink/50 shrink-0 ml-2">{p.status}</span>
            </div>
            <p className="text-sm text-ink/60 mt-1">{p.research_name}</p>
            <div className="flex gap-2 mt-3 text-xs">
              {p.target_api && <span className="bg-primary-soft text-primary px-2 py-0.5 rounded-sm">{p.target_api}</span>}
              {p.dosage_form && <span className="bg-ink/5 text-ink/60 px-2 py-0.5 rounded-sm">{p.dosage_form}</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
