"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface CqaOption { id: string; attribute: string; }
interface CmaRow {
  id: string;
  material: string;
  attribute: string;
  impact_description: string | null;
  cqa_id: string | null;
}

export function CmaTab({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<CmaRow[]>([]);
  const [cqaOptions, setCqaOptions] = useState<CqaOption[]>([]);
  const [material, setMaterial] = useState("");
  const [attribute, setAttribute] = useState("");
  const [impact, setImpact] = useState("");
  const [cqaId, setCqaId] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [{ data: cmaData }, { data: cqaData }] = await Promise.all([
      supabase.from("cma").select("id, material, attribute, impact_description, cqa_id").eq("project_id", projectId).order("created_at"),
      supabase.from("cqa").select("id, attribute").eq("project_id", projectId)
    ]);
    setRows(cmaData ?? []);
    setCqaOptions(cqaData ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleAdd() {
    if (!material.trim() || !attribute.trim()) return;
    setSaving(true);
    await supabase.from("cma").insert({
      project_id: projectId,
      material,
      attribute,
      impact_description: impact || null,
      cqa_id: cqaId || null
    });
    setMaterial("");
    setAttribute("");
    setImpact("");
    setCqaId("");
    setSaving(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="border border-line bg-surface rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">Tambah CMA</p>
        <div className="grid md:grid-cols-4 gap-3">
          <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Material (API / eksipien)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <input value={attribute} onChange={(e) => setAttribute(e.target.value)} placeholder="Attribute (mis. Particle size)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <select value={cqaId} onChange={(e) => setCqaId(e.target.value)} className="rounded-md border border-line px-3 py-2 text-sm">
            <option value="">Berdampak ke CQA (opsional)</option>
            {cqaOptions.map((c) => <option key={c.id} value={c.id}>{c.attribute}</option>)}
          </select>
          <input value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="Deskripsi dampak" className="rounded-md border border-line px-3 py-2 text-sm" />
        </div>
        <button onClick={handleAdd} disabled={saving} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-60">
          {saving ? "Menyimpan..." : "+ Tambah"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink/50">Belum ada CMA.</p>
      ) : (
        <table className="data-table w-full">
          <thead><tr><th>Material</th><th>Attribute</th><th>Dampak</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.material}</td>
                <td>{r.attribute}</td>
                <td className="text-ink/60">{r.impact_description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
