"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface CppRow {
  id: string;
  process_step: string;
  target: string | null;
  note: string | null;
}

export function CppTab({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<CppRow[]>([]);
  const [processStep, setProcessStep] = useState("");
  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CppRow>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("cpp")
      .select("id, process_step, target, note")
      .eq("project_id", projectId)
      .order("created_at");
    setRows(data ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleAdd() {
    if (!processStep.trim()) return;
    setSaving(true);
    // `parameter` is a legacy required column — mirror process_step into it
    // so older reports/exports that read it still work.
    await supabase.from("cpp").insert({
      project_id: projectId,
      process_step: processStep,
      parameter: processStep,
      target: target || null,
      note: note || null
    });
    setProcessStep("");
    setTarget("");
    setNote("");
    setSaving(false);
    load();
  }

  function startEdit(row: CppRow) {
    setEditingId(row.id);
    setEditDraft({ process_step: row.process_step, target: row.target, note: row.note });
  }

  async function saveEdit(id: string) {
    await supabase.from("cpp").update(editDraft).eq("id", id);
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("cpp").delete().eq("id", id);
    setConfirmDeleteId(null);
    load();
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-ink/45 bg-primary-soft/60 border border-primary/20 rounded-md px-3 py-2">
        Process parameter for subsequent formulation/development stage — CPP di sini bersifat
        pertimbangan awal, bukan parameter proses final.
      </p>

      <div className="border border-line bg-surface rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">Tambah CPP Element</p>
        <div className="grid md:grid-cols-3 gap-3">
          <input value={processStep} onChange={(e) => setProcessStep(e.target.value)} placeholder="Element (mis. Kecepatan Injeksi Solven)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target (mis. 0.5-2 mL/menit)" className="rounded-md border border-line px-3 py-2 text-sm" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Justifikasi" className="rounded-md border border-line px-3 py-2 text-sm" />
        </div>
        <button onClick={handleAdd} disabled={saving} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-60">
          {saving ? "Menyimpan..." : "+ Tambah"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink/50">Belum ada CPP Element.</p>
      ) : (
        <table className="data-table w-full">
          <thead><tr><th>Element</th><th>Target</th><th>Justifikasi</th><th className="w-20"></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {editingId === r.id ? (
                  <>
                    <td><input value={editDraft.process_step ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, process_step: e.target.value }))} className="w-full rounded border border-line px-2 py-1 text-sm" /></td>
                    <td><input value={editDraft.target ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, target: e.target.value }))} className="w-full rounded border border-line px-2 py-1 text-sm" /></td>
                    <td><input value={editDraft.note ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, note: e.target.value }))} className="w-full rounded border border-line px-2 py-1 text-sm" /></td>
                    <td className="flex gap-1">
                      <button onClick={() => saveEdit(r.id)} className="text-risk-low"><Check size={15} /></button>
                      <button onClick={() => setEditingId(null)} className="text-ink/40"><X size={15} /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{r.process_step}</td>
                    <td>{r.target ?? "—"}</td>
                    <td className="text-ink/60">{r.note ?? "—"}</td>
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
