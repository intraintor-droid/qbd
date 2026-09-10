"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

interface RiskRow {
  id: string;
  risk_factor: string;
  severity: number;
  occurrence: number;
  detectability: number;
  rpn: number;
  risk_level: string;
  rationale: string | null;
  study_required: string | null;
}

function levelFromRpn(rpn: number): "critical" | "high" | "medium" | "low" {
  if (rpn >= 200) return "critical";
  if (rpn >= 100) return "high";
  if (rpn >= 40) return "medium";
  return "low";
}

export function RiskAssessmentTab({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [rows, setRows] = useState<RiskRow[]>([]);
  const [riskFactor, setRiskFactor] = useState("");
  const [severity, setSeverity] = useState(5);
  const [occurrence, setOccurrence] = useState(5);
  const [detectability, setDetectability] = useState(5);
  const [rationale, setRationale] = useState("");
  const [studyRequired, setStudyRequired] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from("risk_assessments")
      .select("id, risk_factor, severity, occurrence, detectability, rpn, risk_level, rationale, study_required")
      .eq("project_id", projectId)
      .order("rpn", { ascending: false });
    setRows(data ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const previewRpn = severity * occurrence * detectability;

  async function handleAdd() {
    if (!riskFactor.trim()) return;
    setSaving(true);
    await supabase.from("risk_assessments").insert({
      project_id: projectId,
      risk_factor: riskFactor,
      severity,
      occurrence,
      detectability,
      risk_level: levelFromRpn(previewRpn),
      rationale: rationale || null,
      study_required: studyRequired || null
    });
    setRiskFactor("");
    setRationale("");
    setStudyRequired("");
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("risk_assessments").delete().eq("id", id);
    setConfirmDeleteId(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="border border-line bg-surface rounded-md p-4 space-y-3">
        <p className="text-sm font-medium">Tambah Penilaian Risiko (FMEA)</p>
        <input
          value={riskFactor}
          onChange={(e) => setRiskFactor(e.target.value)}
          placeholder="Risk factor (mis. API particle size → Dissolution)"
          className="w-full rounded-md border border-line px-3 py-2 text-sm"
        />
        <div className="grid md:grid-cols-3 gap-4">
          <ScoreSlider label="Severity" value={severity} onChange={setSeverity} />
          <ScoreSlider label="Occurrence" value={occurrence} onChange={setOccurrence} />
          <ScoreSlider label="Detectability" value={detectability} onChange={setDetectability} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">RPN: <span className="font-mono font-medium">{previewRpn}</span></span>
          <span className={`badge-risk-${levelFromRpn(previewRpn)} text-[11px] px-2 py-0.5 rounded-sm capitalize`}>
            {levelFromRpn(previewRpn)}
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={rationale} onChange={(e) => setRationale(e.target.value)} placeholder="Rationale" className="rounded-md border border-line px-3 py-2 text-sm" />
          <input value={studyRequired} onChange={(e) => setStudyRequired(e.target.value)} placeholder="Study required" className="rounded-md border border-line px-3 py-2 text-sm" />
        </div>
        <button onClick={handleAdd} disabled={saving} className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-60">
          {saving ? "Menyimpan..." : "+ Tambah"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink/50">Belum ada penilaian risiko.</p>
      ) : (
        <table className="data-table w-full">
          <thead><tr><th>Risk Factor</th><th>S</th><th>O</th><th>D</th><th>RPN</th><th>Level</th><th>Study Required</th><th className="w-16"></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.risk_factor}</td>
                <td className="text-center">{r.severity}</td>
                <td className="text-center">{r.occurrence}</td>
                <td className="text-center">{r.detectability}</td>
                <td className="text-center font-mono">{r.rpn}</td>
                <td><span className={`badge-risk-${r.risk_level} text-[11px] px-2 py-0.5 rounded-sm capitalize`}>{r.risk_level}</span></td>
                <td className="text-ink/60">{r.study_required ?? "—"}</td>
                <td>
                  {confirmDeleteId === r.id ? (
                    <div className="flex gap-1.5 items-center whitespace-nowrap">
                      <button onClick={() => handleDelete(r.id)} className="text-[11px] bg-risk-critical text-white px-1.5 py-0.5 rounded">Ya</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-[11px] text-ink/50">Batal</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(r.id)} className="text-ink/40 hover:text-risk-critical">
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ScoreSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs text-ink/60 flex justify-between">
        <span>{label}</span><span className="font-mono">{value}</span>
      </label>
      <input type="range" min={1} max={10} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}
