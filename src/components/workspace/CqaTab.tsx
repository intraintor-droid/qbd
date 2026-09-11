"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

interface QtppOption { id: string; attribute: string; }
interface CqaRow {
  id: string;
  attribute: string;
  target: string | null;
  importance: number;
  reason: string | null;
  qtpp_id: string | null;
}

function colorForImportance(pct: number) {
  if (pct >= 70) return "#B3123A"; // risk-critical
  if (pct >= 40) return "#C08B2E"; // risk-medium
  return "#2F7D52"; // risk-low
}

export function CqaTab({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<CqaRow[]>([]);
  const [qtppOptions, setQtppOptions] = useState<QtppOption[]>([]);
  const [attribute, setAttribute] = useState("");
  const [target, setTarget] = useState("");
  const [importance, setImportance] = useState(70);
  const [reason, setReason] = useState("");
  const [qtppId, setQtppId] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CqaRow>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function load() {
    const [{ data: cqaData }, { data: qtppData }] = await Promise.all([
      supabase.from("cqa").select("id, attribute, target, importance, reason, qtpp_id").eq("project_id", projectId).order("importance", { ascending: false }),
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
    setImportance(70);
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

  const chartData = [...rows].sort((a, b) => a.importance - b.importance).map((r) => ({
    name: r.attribute.length > 22 ? r.attribute.slice(0, 20) + "…" : r.attribute,
    importance: r.importance
  }));

  return (
    <div className="space-y-6">
      <div className="border border-line bg-surface rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">Tambah CQA Element</p>
        <div className="grid md:grid-cols-5 gap-3">
          <input value={attribute} onChange={(e) => setAttribute(e.target.value)} placeholder="Element (mis. Ukuran Partikel)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target (mis. 50-200 nm)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <div className="flex items-center gap-2 rounded-md border border-line px-3 py-2">
            <input type="range" min={0} max={100} value={importance} onChange={(e) => setImportance(Number(e.target.value))} className="flex-1 accent-primary" />
            <span className="text-xs font-mono w-9 text-right">{importance}%</span>
          </div>
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
        <>
          <div className="border border-line bg-surface rounded-md p-4">
            <p className="text-sm font-medium mb-3">Tingkat Kepentingan (%)</p>
            <ResponsiveContainer width="100%" height={Math.max(120, chartData.length * 36)}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1D9E6" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Importance"]} />
                <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={colorForImportance(d.importance)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

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
                        <div className="flex items-center gap-2">
                          <input type="range" min={0} max={100} value={editDraft.importance ?? 50} onChange={(e) => setEditDraft((d) => ({ ...d, importance: Number(e.target.value) }))} className="w-20 accent-primary" />
                          <span className="text-xs font-mono">{editDraft.importance ?? 50}%</span>
                        </div>
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
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-line overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${r.importance}%`, backgroundColor: colorForImportance(r.importance) }} />
                          </div>
                          <span className="text-xs font-mono" style={{ color: colorForImportance(r.importance) }}>{r.importance}%</span>
                        </div>
                      </td>
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
        </>
      )}
    </div>
  );
}
