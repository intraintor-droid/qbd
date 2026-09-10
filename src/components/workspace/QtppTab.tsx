"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface QtppRow {
  id: string;
  attribute: string;
  target: string;
  justification: string | null;
  ai_suggested: boolean;
}

export function QtppTab({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<QtppRow[]>([]);
  const [attribute, setAttribute] = useState("");
  const [target, setTarget] = useState("");
  const [justification, setJustification] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("qtpp")
      .select("id, attribute, target, justification, ai_suggested")
      .eq("project_id", projectId)
      .order("created_at");
    setRows(data ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleAdd() {
    if (!attribute.trim() || !target.trim()) return;
    setSaving(true);
    await supabase.from("qtpp").insert({ project_id: projectId, attribute, target, justification: justification || null });
    setAttribute("");
    setTarget("");
    setJustification("");
    setSaving(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="border border-line bg-surface rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">Tambah Atribut QTPP</p>
        <div className="grid md:grid-cols-3 gap-3">
          <input value={attribute} onChange={(e) => setAttribute(e.target.value)} placeholder="Attribute (mis. Dosage form)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target" className="rounded-md border border-line px-3 py-2 text-sm" />
          <input value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Justifikasi (opsional)" className="rounded-md border border-line px-3 py-2 text-sm" />
        </div>
        <button onClick={handleAdd} disabled={saving} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-60">
          {saving ? "Menyimpan..." : "+ Tambah"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink/50">Belum ada atribut QTPP. Definisikan target produk sebelum melanjutkan ke CQA.</p>
      ) : (
        <table className="data-table w-full">
          <thead><tr><th>Attribute</th><th>Target</th><th>Justifikasi</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.attribute}</td>
                <td>{r.target}</td>
                <td className="text-ink/60">{r.justification ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
