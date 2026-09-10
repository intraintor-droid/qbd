"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ProjectOption { id: string; research_title: string; }
interface ChatTurn {
  question: string;
  answer: string;
  sources: Array<{ title: string; doi?: string | null; url?: string | null }>;
  confidence: string;
  insufficientEvidence: boolean;
}

export default function AiAssistantPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState("");
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("projects").select("id, research_title").is("deleted_at", null);
      setProjects(data ?? []);
      if (data && data.length > 0) setProjectId(data[0].id);
    })();
  }, []);

  async function handleAsk() {
    if (!question.trim() || !projectId) return;
    setLoading(true);
    const res = await fetch("/api/ai/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, projectId })
    });
    const data = await res.json();
    setHistory((h) => [...h, { question, ...data }]);
    setQuestion("");
    setLoading(false);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="font-mono text-xs text-primary">RAG · grounded on saved literature</p>
        <h1 className="font-display text-2xl mt-1">AI Research Assistant</h1>
        <p className="text-sm text-ink/60 mt-1">
          Jawaban hanya didasarkan pada jurnal dan evidence yang Anda simpan di proyek — bukan pengetahuan umum AI.
        </p>
      </div>

      <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rounded-md border border-line px-3 py-2 text-sm">
        {projects.length === 0 && <option value="">Belum ada proyek</option>}
        {projects.map((p) => <option key={p.id} value={p.id}>{p.research_title}</option>)}
      </select>

      <div className="space-y-4">
        {history.map((turn, i) => (
          <div key={i} className="space-y-2">
            <p className="text-sm font-medium">{turn.question}</p>
            <div className="border border-line bg-surface rounded-md p-4">
              <p className="text-sm leading-relaxed">{turn.answer}</p>
              {turn.sources?.length > 0 && (
                <ul className="mt-3 text-xs text-ink/60 space-y-1">
                  {turn.sources.map((s, j) => (
                    <li key={j}>
                      · {s.title} {s.doi && <span className="font-mono">doi:{s.doi}</span>}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-[11px] text-ink/45 mt-2">
                Confidence: <span className="capitalize">{turn.confidence}</span>
                {turn.insufficientEvidence && " · evidence terbatas"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="mis. Apa masalah kelarutan API ini?"
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={handleAsk}
          disabled={loading || !projectId}
          className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Menganalisis..." : "Tanya"}
        </button>
      </div>
    </div>
  );
}
