"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface CqaOption { id: string; attribute: string; }
interface CmaRow {
  id: string;
  material: string;
  attribute: string;
  target: string | null;
  impact_description: string | null;
  cqa_id: string | null;
}

export function CmaTab({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<CmaRow[]>([]);
  const [cqaOptions, setCqaOptions] = useState<CqaOption[]>([]);
  const [material, setMaterial] = useState("");
  const [attribute, setAttribute] = useState("");
  const [target, setTarget] = useState("");
  const [impact, setImpact] = useState("");
  const [cqaId, setCqaId] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CmaRow>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function load() {
    const [{ data: cmaData }, { data: cqaData }] = await Promise.all([
      supabase.from("cma").select("id, material, attribute, target, impact_description, cqa_id").eq("project_id", projectId).order("created_at"),
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
      target: target || null,
      impact_description: impact || null,
      cqa_id: cqaId || null
    });
    setMaterial("");
    setAttribute("");
    setTarget("");
    setImpact("");
    setCqaId("");
    setSaving(false);
    load();
  }

  function startEdit(row: CmaRow) {
    setEditingId(row.id);
    setEditDraft({ material: row.material, attribute: row.attribute, target: row.target, impact_description: row.impact_description });
  }

  async function saveEdit(id: string) {
    await supabase.from("cma").update(editDraft).eq("id", id);
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("cma").delete().eq("id", id);
    setConfirmDeleteId(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="border border-line bg-surface rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">Tambah CMA Element</p>
        <div className="grid md:grid-cols-5 gap-3">
          <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Material (mis. Soy phosphatidylcholine)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <input value={attribute} onChange={(e) => setAttribute(e.target.value)} placeholder="Element (mis. Kemurnian)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target (mis. ≥96%)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <select value={cqaId} onChange={(e) => setCqaId(e.target.value)} className="rounded-md border border-line px-3 py-2 text-sm">
            <option value="">Berdampak ke CQA (opsional)</option>
            {cqaOptions.map((c) => <option key={c.id} value={c.id}>{c.attribute}</option>)}
          </select>
          <input value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="Justifikasi" className="rounded-md border border-line px-3 py-2 text-sm" />
        </div>
        <button onClick={handleAdd} disabled={saving} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-60">
          {saving ? "Menyimpan..." : "+ Tambah"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink/50">Belum ada CMA.</p>
      ) : (
        <table className="data-table w-full">
          <thead><tr><th>Material</th><th>Element</th><th>Target</th><th>Justifikasi</th><th className="w-20"></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {editingId === r.id ? (
                  <>
                    <td><input value={editDraft.material ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, material: e.target.value }))} className="w-full rounded border border-line px-2 py-1 text-sm" /></td>
                    <td><input value={editDraft.attribute ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, attribute: e.target.value }))} className="w-full rounded border border-line px-2 py-1 text-sm" /></td>
                    <td><input value={editDraft.target ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, target: e.target.value }))} className="w-full rounded border border-line px-2 py-1 text-sm" /></td>
                    <td><input value={editDraft.impact_description ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, impact_description: e.target.value }))} className="w-full rounded border border-line px-2 py-1 text-sm" /></td>
                    <td className="flex gap-1">
                      <button onClick={() => saveEdit(r.id)} className="text-risk-low"><Check size={15} /></button>
                      <button onClick={() => setEditingId(null)} className="text-ink/40"><X size={15} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{r.material}</td>
                    <td>{r.attribute}</td>
                    <td>{r.target ?? "—"}</td>
                    <td className="text-ink/60">{r.impact_description ?? "—"}</td>
                    <td>
                      {confirmDeleteId === r.id ? (
                        <div className="flex gap-1.5 items-center whitespace-nowrap">
                          <button onClick={() => handleDelete(r.id)} className="text-[11px] bg-risk-critical text-white px-1.5 py-0.5 rounded">Ya</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-[11px] text-ink/50">Batal</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => startEdit(r)} className="text-ink/40 hover:text-primary"><Pencil size={14} /></button>
                          <button onClick={() => setConfirmDeleteId(r.id)} className="text-ink/40 hover:text-risk-critical"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
