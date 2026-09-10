import { NextRequest, NextResponse } from "next/server";
import { getAIProvider, type RAGRequest } from "@/lib/ai/provider";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * RAG pipeline (spec section 34):
 * User Query -> pull saved literature + evidence + QbD data for the
 * project from Supabase -> AI Analysis grounded ONLY in that retrieved
 * context -> structured Answer + Evidence + Sources + Confidence.
 *
 * The AI is never given free rein to answer from general knowledge
 * when the question depends on project-specific literature — the
 * anti-hallucination system prompt (see lib/ai/provider.ts) enforces
 * "Insufficient evidence found." when context is thin.
 */
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question, projectId } = await req.json();
  if (!question) return NextResponse.json({ error: "`question` is required" }, { status: 400 });

  let retrievedLiterature: RAGRequest["retrievedLiterature"] = [];
  let extractedEvidence: RAGRequest["extractedEvidence"] = [];
  let projectContext: Record<string, unknown> | undefined;

  if (projectId) {
    const [{ data: project }, { data: literature }, { data: evidence }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase
        .from("literature")
        .select("title, authors, publication_year, journal, doi, abstract")
        .eq("project_id", projectId)
        .eq("is_saved", true)
        .limit(25),
      supabase
        .from("literature_evidence")
        .select("parameter, value, confidence, literature_id, literature(title, doi)")
        .limit(50)
    ]);

    projectContext = project ?? undefined;
    retrievedLiterature = (literature ?? []).map((l) => ({
      title: l.title,
      authors: l.authors ?? [],
      year: l.publication_year ?? undefined,
      journal: l.journal ?? undefined,
      doi: l.doi ?? undefined,
      abstract: l.abstract ?? undefined
    }));
    extractedEvidence = (evidence ?? []).map((e: any) => ({
      parameter: e.parameter,
      value: e.value ?? undefined,
      source: e.literature?.title ?? "Unknown source",
      confidence: e.confidence
    }));
  }

  if (retrievedLiterature.length === 0 && extractedEvidence.length === 0) {
    return NextResponse.json({
      answer:
        "Insufficient evidence found. Belum ada jurnal atau evidence tersimpan pada proyek ini — cari dan simpan literatur terlebih dahulu di modul Literature Search.",
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
      projectContext,
      retrievedLiterature,
      extractedEvidence
    });
    return NextResponse.json(response);
  } catch (err) {
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
