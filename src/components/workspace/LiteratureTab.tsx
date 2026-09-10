"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LiteraturePaper } from "@/lib/literature/types";

interface SavedLit {
  id: string;
  title: string;
  journal: string | null;
  publication_year: number | null;
  doi: string | null;
}

export function LiteratureTab({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [onlyRecent, setOnlyRecent] = useState(true);
  const [includeClassic, setIncludeClassic] = useState(true);
  const [onlyOpenAccess, setOnlyOpenAccess] = useState(false);
  const [results, setResults] = useState<LiteraturePaper[]>([]);
  const [meta, setMeta] = useState<{ sourcesQueried: string[]; sourcesFailed: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SavedLit[]>([]);
  const [savingDoi, setSavingDoi] = useState<string | null>(null);

  async function loadSaved() {
    const { data } = await supabase
      .from("literature")
      .select("id, title, journal, publication_year, doi")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setSaved(data ?? []);
  }

  useEffect(() => {
    loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    const res = await fetch("/api/literature/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, projectId, onlyRecent, includeClassic, onlyOpenAccess })
    });
    const data = await res.json();
    setLoading(false);
    setResults(data.papers ?? []);
    setMeta({ sourcesQueried: data.sourcesQueried ?? [], sourcesFailed: data.sourcesFailed ?? [] });
  }

  async function handleSave(paper: LiteraturePaper) {
    setSavingDoi(paper.doi ?? paper.title);
    await supabase.from("literature").insert({
      project_id: projectId,
      title: paper.title,
      authors: paper.authors,
      journal: paper.journal,
      publication_year: paper.publicationYear,
      article_type: paper.articleType,
      doi: paper.doi,
      url: paper.url,
      abstract: paper.abstract,
      is_open_access: paper.isOpenAccess,
      external_id: paper.externalId,
      is_saved: true
    });
    setSavingDoi(null);
    loadSaved();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex gap-2 max-w-xl">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="mis. paracetamol solubility preformulation"
            className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Mencari..." : "Cari Jurnal"}
          </button>
        </div>
        <div className="flex gap-4 text-xs text-ink/60">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={onlyRecent} onChange={(e) => setOnlyRecent(e.target.checked)} />
            Only recent studies (5–10 tahun)
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={includeClassic} onChange={(e) => setIncludeClassic(e.target.checked)} />
            Include classic/reference studies
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={onlyOpenAccess} onChange={(e) => setOnlyOpenAccess(e.target.checked)} />
            Open access only
          </label>
        </div>
        {meta && (
          <p className="text-[11px] text-ink/45">
            Sumber: {meta.sourcesQueried.join(", ") || "—"}
            {meta.sourcesFailed.length > 0 && (
              <span className="text-risk-medium"> · gagal: {meta.sourcesFailed.join(", ")}</span>
            )}
          </p>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">{results.length} hasil ditemukan</p>
          {results.map((paper, i) => (
            <div key={i} className="border border-line bg-surface rounded-md p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{paper.title}</p>
                  <p className="text-xs text-ink/55 mt-1">
                    {(paper.authors || []).slice(0, 3).join(", ") || "Author n/a"}
                    {paper.authors && paper.authors.length > 3 ? " et al." : ""} · {paper.journal ?? "—"} ·{" "}
                    {paper.publicationYear ?? "n.d."} · <span className="uppercase">{paper.sourceName}</span>
                    {paper.isOpenAccess && <span className="text-risk-low"> · Open Access</span>}
                  </p>
                  {paper.doi && (
                    <a href={`https://doi.org/${paper.doi}`} target="_blank" className="text-[11px] font-mono text-primary underline">
                      doi:{paper.doi}
                    </a>
                  )}
                </div>
                <button
                  onClick={() => handleSave(paper)}
                  disabled={savingDoi === (paper.doi ?? paper.title)}
                  className="shrink-0 text-xs bg-primary-soft text-primary px-3 py-1.5 rounded-md hover:bg-primary/20 disabled:opacity-60"
                >
                  {savingDoi === (paper.doi ?? paper.title) ? "..." : "+ Simpan"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-2">Jurnal Tersimpan di Proyek Ini ({saved.length})</p>
        {saved.length === 0 ? (
          <p className="text-sm text-ink/50">Belum ada jurnal tersimpan.</p>
        ) : (
          <table className="data-table w-full">
            <thead><tr><th>Judul</th><th>Jurnal</th><th>Tahun</th><th>DOI</th></tr></thead>
            <tbody>
              {saved.map((l) => (
                <tr key={l.id}>
                  <td>{l.title}</td>
                  <td>{l.journal ?? "—"}</td>
                  <td>{l.publication_year ?? "—"}</td>
                  <td className="font-mono text-xs">{l.doi ?? "DOI not available"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
