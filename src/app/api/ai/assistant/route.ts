import { NextRequest, NextResponse } from "next/server";
import { getAIProvider, type RAGRequest } from "@/lib/ai/provider";
import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const requestSchema = z.object({
  question: z.string().trim().min(1).max(2000),
  projectId: z.string().uuid()
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
    return NextResponse.json({ error: "`question` dan `projectId` wajib valid." }, { status: 400 });
  }

  const { question, projectId } = parsed.data;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .is("deleted_at", null)
    .single();

  // Fail closed. RLS determines whether the authenticated user can see this project.
  if (projectError || !project) {
    return NextResponse.json({ error: "Project tidak ditemukan atau tidak dapat diakses." }, { status: 404 });
  }

  const { data: literature, error: literatureError } = await supabase
    .from("literature")
    .select("id, title, authors, publication_year, journal, doi, abstract")
    .eq("project_id", projectId)
    .eq("is_saved", true)
    .is("deleted_at", null)
    .limit(25);

  if (literatureError) {
    return NextResponse.json({ error: "Gagal mengambil literatur proyek." }, { status: 500 });
  }

  // IMPORTANT: evidence is scoped through the literature IDs belonging to this
  // project. A plain literature_evidence query would let a reviewer-accessible
  // account mix evidence from unrelated projects into the AI context.
  const literatureIds = (literature ?? []).map((l) => l.id);
  let evidence: Array<{
    parameter: string;
    value: string | null;
    confidence: "high" | "medium" | "low";
    literature_id: string;
    literature: { title: string; doi: string | null } | null;
  }> = [];

  if (literatureIds.length > 0) {
    const { data, error: evidenceError } = await supabase
      .from("literature_evidence")
      .select("parameter, value, confidence, literature_id, literature(title, doi)")
      .in("literature_id", literatureIds)
      .limit(50);

    if (evidenceError) {
      return NextResponse.json({ error: "Gagal mengambil evidence proyek." }, { status: 500 });
    }
    evidence = (data ?? []) as typeof evidence;
  }

  const retrievedLiterature: RAGRequest["retrievedLiterature"] = (literature ?? []).map((l) => ({
    title: l.title,
    authors: l.authors ?? [],
    year: l.publication_year ?? undefined,
    journal: l.journal ?? undefined,
    doi: l.doi ?? undefined,
    abstract: l.abstract ?? undefined
  }));

  const extractedEvidence: NonNullable<RAGRequest["extractedEvidence"]> = evidence
    .filter((e) => Boolean(e.literature?.title))
    .map((e) => ({
      parameter: e.parameter,
      value: e.value ?? undefined,
      source: e.literature?.title as string,
      doi: e.literature?.doi ?? undefined,
      confidence: e.confidence
    }));

  if (retrievedLiterature.length === 0 && extractedEvidence.length === 0) {
    return NextResponse.json({
      answer: "Insufficient evidence found. Belum ada jurnal atau evidence tersimpan pada proyek ini — cari dan simpan literatur terlebih dahulu di modul Literature Search.",
      evidence: [],
      sources: [],
      confidence: "low",
      insufficientEvidence: true
    });
  }

  try {
    const provider = getAIProvider();
    const response = await provider.complete({
      question,
      projectContext: project,
      retrievedLiterature,
      extractedEvidence
    });
    return NextResponse.json(response);
  } catch (err) {
    console.error("AI assistant request failed", err);
    return NextResponse.json(
      {
        answer: "AI provider request failed. Periksa AI_PROVIDER dan API key terkait di environment variables.",
        evidence: [],
        sources: [],
        confidence: "low",
        insufficientEvidence: true
      },
      { status: 502 }
    );
  }
}
