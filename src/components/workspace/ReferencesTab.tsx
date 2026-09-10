"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LitRow {
  id: string;
  title: string;
  authors: string[] | null;
  journal: string | null;
  publication_year: number | null;
  doi: string | null;
}

function formatAPA7(l: LitRow): string {
  const authors = l.authors && l.authors.length > 0 ? l.authors.join(", ") : "Author not available";
  const year = l.publication_year ?? "n.d.";
  const doi = l.doi ? `https://doi.org/${l.doi}` : "DOI not available";
  return `${authors} (${year}). ${l.title}. ${l.journal ?? "Journal not available"}. ${doi}`;
}

function formatVancouver(l: LitRow, n: number): string {
  const authors = l.authors && l.authors.length > 0 ? l.authors.join(", ") : "Author not available";
  const year = l.publication_year ?? "n.d.";
  const doi = l.doi ? ` doi:${l.doi}` : " DOI not available";
  return `${n}. ${authors}. ${l.title}. ${l.journal ?? "Journal not available"}. ${year}.${doi}`;
}

export function ReferencesTab({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [literature, setLiterature] = useState<LitRow[]>([]);
  const [style, setStyle] = useState<"apa7" | "vancouver">("apa7");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("literature")
        .select("id, title, authors, journal, publication_year, doi")
        .eq("project_id", projectId)
        .order("publication_year", { ascending: false });
      setLiterature(data ?? []);
    })();
  }, [projectId]);

  const bibliography =
    style === "apa7"
      ? literature.map(formatAPA7)
      : literature.map((l, i) => formatVancouver(l, i + 1));

  async function handleCopy() {
    await navigator.clipboard.writeText(bibliography.join("\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={style} onChange={(e) => setStyle(e.target.value as "apa7" | "vancouver")} className="rounded-md border border-line px-3 py-2 text-sm">
          <option value="apa7">APA 7</option>
          <option value="vancouver">Vancouver</option>
        </select>
        <button onClick={handleCopy} className="text-sm bg-primary-soft text-primary px-3 py-1.5 rounded-md hover:bg-primary/20">
          {copied ? "Tersalin!" : "Copy Bibliography"}
        </button>
      </div>

      {literature.length === 0 ? (
        <p className="text-sm text-ink/50">Belum ada jurnal tersimpan di proyek ini untuk dijadikan referensi.</p>
      ) : (
        <div className="border border-line bg-surface rounded-md p-4 space-y-3">
          {bibliography.map((entry, i) => (
            <p key={i} className="text-sm leading-relaxed">{entry}</p>
          ))}
        </div>
      )}
      <p className="text-[11px] text-ink/45">
        DOI yang tidak ditemukan pada sumber akan tetap ditandai "DOI not available" — tidak pernah dibuat-buat.
      </p>
    </div>
  );
}
