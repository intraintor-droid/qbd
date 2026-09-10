"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface QtppOption { id: string; attribute: string; }
interface CqaRow {
  id: string;
  attribute: string;
  importance: string;
  reason: string | null;
  qtpp_id: string | null;
}

export function CqaTab({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<CqaRow[]>([]);
  const [qtppOptions, setQtppOptions] = useState<QtppOption[]>([]);
  const [attribute, setAttribute] = useState("");
  const [importance, setImportance] = useState("high");
  const [reason, setReason] = useState("");
  const [qtppId, setQtppId] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [{ data: cqaData }, { data: qtppData }] = await Promise.all([
      supabase.from("cqa").select("id, attribute, importance, reason, qtpp_id").eq("project_id", projectId).order("created_at"),
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
      importance,
      reason: reason || null,
      qtpp_id: qtppId || null
    });
    setAttribute("");
    setReason("");
    setQtppId("");
    setSaving(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="border border-line bg-surface rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">Tambah CQA</p>
        <div className="grid md:grid-cols-4 gap-3">
          <input value={attribute} onChange={(e) => setAttribute(e.target.value)} placeholder="Attribute (mis. Dissolution)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <select value={importance} onChange={(e) => setImportance(e.target.value)} className="rounded-md border border-line px-3 py-2 text-sm">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={qtppId} onChange={(e) => setQtppId(e.target.value)} className="rounded-md border border-line px-3 py-2 text-sm">
            <option value="">Terkait QTPP (opsional)</option>
            {qtppOptions.map((q) => <option key={q.id} value={q.id}>{q.attribute}</option>)}
          </select>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan / evidence" className="rounded-md border border-line px-3 py-2 text-sm" />
        </div>
        <button onClick={handleAdd} disabled={saving} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-60">
          {saving ? "Menyimpan..." : "+ Tambah"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink/50">Belum ada CQA.</p>
      ) : (
        <table className="data-table w-full">
          <thead><tr><th>Attribute</th><th>Importance</th><th>Reason</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.attribute}</td>
                <td><span className={`badge-risk-${r.importance === "high" ? "high" : r.importance === "medium" ? "medium" : "low"} text-[11px] px-2 py-0.5 rounded-sm capitalize`}>{r.importance}</span></td>
                <td className="text-ink/60">{r.reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
