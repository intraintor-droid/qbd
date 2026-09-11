import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchLiterature } from "@/lib/literature/aggregator";
import { createServerSupabase } from "@/lib/supabase/server";

const requestSchema = z.object({
  query: z.string().trim().min(1).max(500),
  projectId: z.string().uuid().optional().nullable(),
  yearFrom: z.number().int().min(1900).max(2100).optional().nullable(),
  yearTo: z.number().int().min(1900).max(2100).optional().nullable(),
  onlyOpenAccess: z.boolean().optional(),
  onlyRecent: z.boolean().optional(),
  includeClassic: z.boolean().optional(),
  articleType: z.string().trim().max(100).optional().nullable()
}).superRefine((value, ctx) => {
  if (value.yearFrom != null && value.yearTo != null && value.yearFrom > value.yearTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["yearFrom"],
      message: "yearFrom cannot be greater than yearTo"
    });
  }
});

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Parameter pencarian tidak valid." }, { status: 400 });
  }

  const {
    query,
    projectId,
    yearFrom,
    yearTo,
    onlyOpenAccess,
    onlyRecent,
    includeClassic,
    articleType
  } = parsed.data;

  if (projectId) {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .is("deleted_at", null)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project tidak ditemukan atau tidak dapat diakses." }, { status: 404 });
    }
  }

  try {
    const result = await searchLiterature(query, {
      yearFrom: yearFrom ?? undefined,
      yearTo: yearTo ?? undefined,
      onlyOpenAccess,
      onlyRecent,
      includeClassic,
      articleType: articleType ?? undefined
    });

    // Fire-and-forget search history log — never blocks the response.
    void supabase
      .from("search_history")
      .insert({
        user_id: user.id,
        project_id: projectId ?? null,
        query,
        filters: { yearFrom, yearTo, onlyOpenAccess, onlyRecent, includeClassic, articleType },
        result_count: result.papers.length
      });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Literature search failed", err);
    return NextResponse.json({ error: "Literature search failed." }, { status: 502 });
  }
}
