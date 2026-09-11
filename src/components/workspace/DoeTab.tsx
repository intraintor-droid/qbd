"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Pencil, Check, X, ChevronDown, ChevronRight } from "lucide-react";

interface Factor { name: string; unit?: string }
interface Run { run: number; values: Record<string, string> }
interface DoeDesign {
  id: string;
  design_name: string;
  design_type: string | null;
  response_variable: string | null;
  factors: Factor[];
  runs: Run[];
  notes: string | null;
}

const DESIGN_TYPES = ["D-Optimal", "Box-Behnken", "Mixture (SLD)", "CCD", "Full Factorial", "Lainnya"];

export function DoeTab({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [designs, setDesigns] = useState<DoeDesign[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState(DESIGN_TYPES[0]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("doe_designs")
      .select("id, design_name, design_type, response_variable, factors, runs, notes")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setDesigns((data as DoeDesign[]) ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleCreate() {
    if (!newName.trim()) return;
    const { data } = await supabase
      .from("doe_designs")
      .insert({
        project_id: projectId,
        design_name: newName,
        design_type: newType,
        factors: [{ name: "Faktor 1" }],
        runs: [{ run: 1, values: { "Faktor 1": "" } }]
      })
      .select("id")
      .single();
    setNewName("");
    setCreating(false);
    await load();
    if (data) setExpandedId(data.id);
  }

  async function handleDeleteDesign(id: string) {
    await supabase.from("doe_designs").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-ink/45 bg-primary-soft/60 border border-primary/20 rounded-md px-3 py-2">
        Buat tabel Design of Experiments bebas — jumlah faktor (kolom) dan run (baris) bisa disesuaikan,
        cocok untuk D-Optimal, Box-Behnken, Mixture design, dsb.
      </p>

      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90"
        >
          + Desain Baru
        </button>
      ) : (
        <div className="border border-line bg-surface rounded-md p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nama desain (mis. DOE Transfersom D-Optimal)"
              className="rounded-md border border-line px-3 py-2 text-sm"
            />
            <select value={newType} onChange={(e) => setNewType(e.target.value)} className="rounded-md border border-line px-3 py-2 text-sm">
              {DESIGN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90">
              Buat
            </button>
            <button onClick={() => setCreating(false)} className="text-sm text-ink/50 px-4 py-1.5">
              Batal
            </button>
          </div>
        </div>
      )}

      {designs.length === 0 && !creating && (
        <p className="text-sm text-ink/50">Belum ada desain eksperimen.</p>
      )}

      <div className="space-y-3">
        {designs.map((d) => (
          <div key={d.id} className="border border-line bg-surface rounded-md overflow-hidden">
            <button
              onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-soft/30 transition-colors"
            >
              <div className="flex items-center gap-2 text-left">
                {expandedId === d.id ? <ChevronDown size={16} className="text-ink/40" /> : <ChevronRight size={16} className="text-ink/40" />}
                <div>
                  <p className="text-sm font-medium">{d.design_name}</p>
                  <p className="text-xs text-ink/50">{d.design_type ?? "—"} · {d.runs.length} run · {d.factors.length} faktor</p>
                </div>
              </div>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); handleDeleteDesign(d.id); }}
                className="text-ink/40 hover:text-risk-critical p-1"
              >
                <Trash2 size={15} />
              </span>
            </button>
            {expandedId === d.id && <DoeGrid design={d} onSaved={load} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function DoeGrid({ design, onSaved }: { design: DoeDesign; onSaved: () => void }) {
  const supabase = createClient();
  const [factors, setFactors] = useState<Factor[]>(design.factors);
  const [runs, setRuns] = useState<Run[]>(design.runs);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  function markDirty() {
    setDirty(true);
  }

  function addFactor() {
    const name = `Faktor ${factors.length + 1}`;
    setFactors((f) => [...f, { name }]);
    setRuns((rs) => rs.map((r) => ({ ...r, values: { ...r.values, [name]: "" } })));
    markDirty();
  }

  function renameFactor(index: number, newName: string) {
    const oldName = factors[index].name;
    setFactors((f) => f.map((fac, i) => (i === index ? { ...fac, name: newName } : fac)));
    setRuns((rs) =>
      rs.map((r) => {
        const { [oldName]: val, ...rest } = r.values;
        return { ...r, values: { ...rest, [newName]: val ?? "" } };
      })
    );
    markDirty();
  }

  function removeFactor(index: number) {
    const name = factors[index].name;
    setFactors((f) => f.filter((_, i) => i !== index));
    setRuns((rs) =>
      rs.map((r) => {
        const { [name]: _drop, ...rest } = r.values;
        return { ...r, values: rest };
      })
    );
    markDirty();
  }

  function addRun() {
    const nextRun = runs.length > 0 ? Math.max(...runs.map((r) => r.run)) + 1 : 1;
    const values: Record<string, string> = {};
    factors.forEach((f) => (values[f.name] = ""));
    setRuns((rs) => [...rs, { run: nextRun, values }]);
    markDirty();
  }

  function removeRun(index: number) {
    setRuns((rs) => rs.filter((_, i) => i !== index));
    markDirty();
  }

  function updateCell(runIndex: number, factorName: string, value: string) {
    setRuns((rs) =>
      rs.map((r, i) => (i === runIndex ? { ...r, values: { ...r.values, [factorName]: value } } : r))
    );
    markDirty();
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("doe_designs").update({ factors, runs }).eq("id", design.id);
    setSaving(false);
    setDirty(false);
    onSaved();
  }

  return (
    <div className="border-t border-line p-4 space-y-3 overflow-x-auto">
      <div className="flex items-center gap-2 mb-1">
        <button onClick={addFactor} className="text-xs flex items-center gap-1 text-primary hover:underline">
          <Plus size={13} /> Tambah faktor
        </button>
        <span className="text-ink/30">·</span>
        <button onClick={addRun} className="text-xs flex items-center gap-1 text-primary hover:underline">
          <Plus size={13} /> Tambah run
        </button>
      </div>

      <table className="text-sm border-collapse min-w-full">
        <thead>
          <tr>
            <th className="text-xs text-ink/50 font-medium text-left px-2 py-1.5 border-b border-line w-14">Run</th>
            {factors.map((f, i) => (
              <th key={i} className="text-xs font-medium text-left px-2 py-1.5 border-b border-line min-w-[140px]">
                <div className="flex items-center gap-1">
                  <input
                    value={f.name}
                    onChange={(e) => renameFactor(i, e.target.value)}
                    className="bg-transparent border-b border-dashed border-line/70 focus:border-primary focus:outline-none w-full text-xs font-medium"
                  />
                  <button onClick={() => removeFactor(i)} className="text-ink/30 hover:text-risk-critical shrink-0">
                    <X size={12} />
                  </button>
                </div>
              </th>
            ))}
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r, ri) => (
            <tr key={ri}>
              <td className="px-2 py-1 border-b border-line/60 font-mono text-xs text-ink/50">{r.run}</td>
              {factors.map((f, fi) => (
                <td key={fi} className="px-2 py-1 border-b border-line/60">
                  <input
                    value={r.values[f.name] ?? ""}
                    onChange={(e) => updateCell(ri, f.name, e.target.value)}
                    className="w-full text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 py-0.5"
                  />
                </td>
              ))}
              <td className="px-1 border-b border-line/60">
                <button onClick={() => removeRun(ri)} className="text-ink/30 hover:text-risk-critical">
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-40 flex items-center gap-1"
        >
          <Check size={13} /> {saving ? "Menyimpan..." : dirty ? "Simpan Perubahan" : "Tersimpan"}
        </button>
        {dirty && <span className="text-[11px] text-risk-medium">Ada perubahan belum disimpan</span>}
      </div>
    </div>
  );
}
