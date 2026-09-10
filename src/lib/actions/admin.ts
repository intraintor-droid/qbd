"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";

async function requireSuperAdmin() {
  const supabase = createServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") {
    throw new Error("Hanya super_admin yang boleh melakukan aksi ini.");
  }
  return { supabase, userId: user.id };
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
}

export async function softDeleteProject(projectId: string) {
  const { supabase } = await requireSuperAdmin();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/projects");
}

export async function updateAppSettings(formData: FormData) {
  const { supabase, userId } = await requireSuperAdmin();

  const { error } = await supabase
    .from("app_settings")
    .update({
      app_name: String(formData.get("app_name") ?? "").trim() || "QbD Preformulation",
      tagline: String(formData.get("tagline") ?? "").trim() || "Research Assistant",
      hero_headline: String(formData.get("hero_headline") ?? "").trim(),
      hero_body: String(formData.get("hero_body") ?? "").trim(),
      color_primary: String(formData.get("color_primary") ?? "#D6246F"),
      color_primary_dark: String(formData.get("color_primary_dark") ?? "#A81856"),
      color_primary_soft: String(formData.get("color_primary_soft") ?? "#FCE4EF"),
      color_accent: String(formData.get("color_accent") ?? "#FF6FA5"),
      updated_by: userId
    })
    .eq("id", true);

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout"); // theme vars live in the root layout — refresh everywhere
}
