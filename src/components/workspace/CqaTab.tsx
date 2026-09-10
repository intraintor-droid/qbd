"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface QtppOption { id: string; attribute: string; }
interface CqaRow {
  id: string;
  attribute: string;
  target: string | null;
  importance: string;
  reason: string | null;
  qtpp_id: string | null;
}

export function CqaTab({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<CqaRow[]>([]);
  const [qtppOptions, setQtppOptions] = useState<QtppOption[]>([]);
  const [attribute, setAttribute] = useState("");
  const [target, setTarget] = useState("");
  const [importance, setImportance] = useState("high");
  const [reason, setReason] = useState("");
  const [qtppId, setQtppId] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CqaRow>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function load() {
    const [{ data: cqaData }, { data: qtppData }] = await Promise.all([
      supabase.from("cqa").select("id, attribute, target, importance, reason, qtpp_id").eq("project_id", projectId).order("created_at"),
      supabase.from("qtpp").select("id, attribute").eq("project_id", projectId)
    ]);
    setRows(cqaData ?? []);
    setQtppOptions(qtppData ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleAdd() {
    if (!attribute.trim()) return;
    setSaving(true);
    await supabase.from("cqa").insert({
      project_id: projectId,
      attribute,
      target: target || null,
      importance,
      reason: reason || null,
      qtpp_id: qtppId || null
    });
    setAttribute("");
    setTarget("");
    setReason("");
    setQtppId("");
    setSaving(false);
    load();
  }

  function startEdit(row: CqaRow) {
    setEditingId(row.id);
    setEditDraft({ attribute: row.attribute, target: row.target, importance: row.importance, reason: row.reason });
  }

  async function saveEdit(id: string) {
    await supabase.from("cqa").update(editDraft).eq("id", id);
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("cqa").delete().eq("id", id);
    setConfirmDeleteId(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="border border-line bg-surface rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">Tambah CQA Element</p>
        <div className="grid md:grid-cols-5 gap-3">
          <input value={attribute} onChange={(e) => setAttribute(e.target.value)} placeholder="Element (mis. Ukuran Partikel)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target (mis. 50-200 nm)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <select value={importance} onChange={(e) => setImportance(e.target.value)} className="rounded-md border border-line px-3 py-2 text-sm">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={qtppId} onChange={(e) => setQtppId(e.target.value)} className="rounded-md border border-line px-3 py-2 text-sm">
            <option value="">Terkait QTPP (opsional)</option>
            {qtppOptions.map((q) => <option key={q.id} value={q.id}>{q.attribute}</option>)}
          </select>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Justifikasi" className="rounded-md border border-line px-3 py-2 text-sm" />
        </div>
        <button onClick={handleAdd} disabled={saving} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-60">
          {saving ? "Menyimpan..." : "+ Tambah"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink/50">Belum ada CQA.</p>
      ) : (
        <table className="data-table w-full">
          <thead><tr><th>Element</th><th>Target</th><th>Importance</th><th>Justifikasi</th><th className="w-20"></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {editingId === r.id ? (
                  <>
                    <td><input value={editDraft.attribute ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, attribute: e.target.value }))} className="w-full rounded border border-line px-2 py-1 text-sm" /></td>
                    <td><input value={editDraft.target ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, target: e.target.value }))} className="w-full rounded border border-line px-2 py-1 text-sm" /></td>
                    <td>
                      <select value={editDraft.importance ?? "high"} onChange={(e) => setEditDraft((d) => ({ ...d, importance: e.target.value }))} className="rounded border border-line px-2 py-1 text-sm">
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </td>
                    <td><input value={editDraft.reason ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, reason: e.target.value }))} className="w-full rounded border border-line px-2 py-1 text-sm" /></td>
                    <td className="flex gap-1">
                      <button onClick={() => saveEdit(r.id)} className="text-risk-low"><Check size={15} /></button>
                      <button onClick={() => setEditingId(null)} className="text-ink/40"><X size={15} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{r.attribute}</td>
                    <td>{r.target ?? "—"}</td>
                    <td><span className={`badge-risk-${r.importance === "high" ? "high" : r.importance === "medium" ? "medium" : "low"} text-[11px] px-2 py-0.5 rounded-sm capitalize`}>{r.importance}</span></td>
                    <td className="text-ink/60">{r.reason ?? "—"}</td>
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
