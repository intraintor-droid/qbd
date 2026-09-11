"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

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

const RISK_COLOR: Record<string, string> = {
  critical: "#B3123A",
  high: "#D9622B",
  medium: "#C08B2E",
  low: "#2F7D52",
  unknown: "#9CA3AF"
};

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
        <>
          <div className="border border-line bg-surface rounded-md p-4">
            <p className="text-sm font-medium mb-3">Peta Prioritas Risiko (RPN)</p>
            <ResponsiveContainer width="100%" height={Math.max(120, rows.length * 38)}>
              <BarChart
                data={[...rows].sort((a, b) => a.rpn - b.rpn).map((r) => ({
                  name: r.risk_factor.length > 26 ? r.risk_factor.slice(0, 24) + "…" : r.risk_factor,
                  rpn: r.rpn,
                  level: r.risk_level
                }))}
                layout="vertical"
                margin={{ left: 8, right: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1D9E6" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [v, "RPN"]} />
                <Bar dataKey="rpn" radius={[0, 4, 4, 0]}>
                  {rows
                    .slice()
                    .sort((a, b) => a.rpn - b.rpn)
                    .map((r, i) => <Cell key={i} fill={RISK_COLOR[r.risk_level] ?? RISK_COLOR.unknown} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 text-[11px] text-ink/55">
              {Object.entries(RISK_COLOR).filter(([k]) => k !== "unknown").map(([level, color]) => (
                <span key={level} className="flex items-center gap-1.5 capitalize">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: color }} />
                  {level}
                </span>
              ))}
            </div>
          </div>

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
        </>
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
