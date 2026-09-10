import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";

export default async function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.id)
    .is("deleted_at", null)
    .single();

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-primary">
          {project.target_api ?? "API belum ditentukan"} · {project.dosage_form ?? "bentuk sediaan belum ditentukan"}
        </p>
        <h1 className="font-display text-2xl mt-1">{project.research_title}</h1>
        <p className="text-sm text-ink/60 mt-1">{project.research_name}</p>
      </div>

      <WorkspaceTabs projectId={project.id} />
    </div>
  );
}
