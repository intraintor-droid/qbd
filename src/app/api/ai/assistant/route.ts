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

  const [{ data: project, error: projectError }, { data: literature, error: literatureError }, { data: evidence, error: evidenceError }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).is("deleted_at", null).single(),
      supabase
        .from("literature")
        .select("title, authors, publication_year, journal, doi, abstract")
        .eq("project_id", projectId)
        .eq("is_saved", true)
        .is("deleted_at", null)
        .limit(25),
      supabase
        .from("literature_evidence")
        .select("parameter, value, confidence, claim, literature_id, literature(title, doi)")
        .limit(50)
    ]);

  // RLS normally hides projects the user cannot access. Still fail closed if
  // the project lookup fails, so an inaccessible project is never sent to AI.
  if (projectError || !project) {
    return NextResponse.json({ error: "Project tidak ditemukan atau tidak dapat diakses." }, { status: 404 });
  }
  if (literatureError || evidenceError) {
    return NextResponse.json({ error: "Gagal mengambil evidence proyek." }, { status: 500 });
  }

  const retrievedLiterature: RAGRequest["retrievedLiterature"] = (literature ?? []).map((l) => ({
    title: l.title,
    authors: l.authors ?? [],
    year: l.publication_year ?? undefined,
    journal: l.journal ?? undefined,
    doi: l.doi ?? undefined,
    abstract: l.abstract ?? undefined
  }));

  const extractedEvidence: NonNullable<RAGRequest["extractedEvidence"]> = (evidence ?? [])
    .filter((e) => e.literature?.title)
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
