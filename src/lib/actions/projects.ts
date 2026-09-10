"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const supabase = createServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const research_name = String(formData.get("research_name") ?? "").trim();
  const research_title = String(formData.get("research_title") ?? "").trim();
  if (!research_name || !research_title) {
    throw new Error("Nama dan judul penelitian wajib diisi.");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user!.id,
      research_name,
      research_title,
      researcher_name: String(formData.get("researcher_name") ?? "") || null,
      institution: String(formData.get("institution") ?? "") || null,
      target_api: String(formData.get("target_api") ?? "") || null,
      dosage_form: String(formData.get("dosage_form") ?? "") || null,
      route_of_administration: String(formData.get("route_of_administration") ?? "") || null,
      formulation_objective: String(formData.get("formulation_objective") ?? "") || null,
      therapeutic_target: String(formData.get("therapeutic_target") ?? "") || null,
      research_year: formData.get("research_year") ? Number(formData.get("research_year")) : null,
      notes: String(formData.get("notes") ?? "") || null
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}
