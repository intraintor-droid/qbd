"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PubChemProperties } from "@/lib/pubchem/client";

const NA = "TIDAK DITEMUKAN";

interface ApiRow {
  id: string;
  name: string;
  pubchem_cid: string | null;
  molecular_formula: string | null;
}

export function ApiProfileTab({ projectId }: { projectId: string }) {
  const supabase = createClient();
  const [apis, setApis] = useState<ApiRow[]>([]);
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState<PubChemProperties | { error: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadApis() {
    const { data } = await supabase
      .from("apis")
      .select("id, name, pubchem_cid, molecular_formula")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setApis(data ?? []);
  }

  useEffect(() => {
    loadApis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setProfile(null);
    const res = await fetch(`/api/pubchem?name=${encodeURIComponent(query)}`);
    const data = await res.json();
    setLoading(false);
    setProfile(data.profile ?? { error: data.error ?? "Unknown error" });
  }

  async function handleSave() {
    if (!profile || "error" in profile) return;
    setSaving(true);
    const { data: apiRow, error } = await supabase
      .from("apis")
      .insert({
        project_id: projectId,
        name: query,
        pubchem_cid: profile.cid,
        smiles_canonical: profile.canonicalSmiles,
        smiles_isomeric: profile.isomericSmiles,
        inchi: profile.inchi,
        inchikey: profile.inchiKey,
        molecular_formula: profile.molecularFormula
      })
      .select("id")
      .single();

    if (!error && apiRow) {
      const props = [
        { property_name: "molecular_weight", property_value: profile.molecularWeight, unit: "g/mol" },
        { property_name: "xlogp", property_value: profile.xLogP },
        { property_name: "hbond_donor_count", property_value: profile.hBondDonorCount },
        { property_name: "hbond_acceptor_count", property_value: profile.hBondAcceptorCount },
        { property_name: "rotatable_bond_count", property_value: profile.rotatableBondCount },
        { property_name: "tpsa", property_value: profile.tpsa, unit: "\u00c5\u00b2" },
        { property_name: "complexity", property_value: profile.complexity },
        { property_name: "exact_mass", property_value: profile.exactMass },
        { property_name: "monoisotopic_mass", property_value: profile.monoisotopicMass }
      ].map((p) => ({
        api_id: apiRow.id,
        property_name: p.property_name,
        property_value: p.property_value ?? NA,
        unit: p.unit ?? null,
        is_predicted: false,
        source_name: "PubChem",
        source_url: profile.sourceUrl,
        confidence: (p.property_value ? "high" : "low") as "high" | "low"
      }));
      await supabase.from("api_properties").insert(props);
    }
    setSaving(false);
    setProfile(null);
    setQuery("");
    loadApis();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-2">Cari bahan aktif (PubChem)</p>
        <div className="flex gap-2 max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="mis. Paracetamol"
            className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Mencari..." : "Cari"}
          </button>
        </div>
      </div>

      {profile && "error" in profile && (
        <p className="text-sm text-risk-critical">{profile.error}</p>
      )}

      {profile && !("error" in profile) && (
        <div className="border border-line bg-surface rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">
              PubChem CID {profile.cid}{" "}
              <a href={profile.sourceUrl} target="_blank" className="text-primary underline text-xs ml-1">
                lihat sumber
              </a>
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan ke Proyek"}
            </button>
          </div>
          <table className="data-table w-full">
            <tbody>
              <PropRow label="Molecular Weight" value={profile.molecularWeight} unit="g/mol" />
              <PropRow label="Molecular Formula" value={profile.molecularFormula} />
              <PropRow label="Canonical SMILES" value={profile.canonicalSmiles} mono />
              <PropRow label="InChIKey" value={profile.inchiKey} mono />
              <PropRow label="XLogP" value={profile.xLogP} />
              <PropRow label="H-Bond Donor" value={profile.hBondDonorCount} />
              <PropRow label="H-Bond Acceptor" value={profile.hBondAcceptorCount} />
              <PropRow label="Rotatable Bonds" value={profile.rotatableBondCount} />
              <PropRow label="TPSA" value={profile.tpsa} unit="\u00c5\u00b2" />
              <PropRow label="Complexity" value={profile.complexity} />
              <PropRow label="Exact Mass" value={profile.exactMass} />
              <PropRow label="Monoisotopic Mass" value={profile.monoisotopicMass} />
            </tbody>
          </table>
          <p className="text-[11px] text-ink/45 mt-2">
            Melting point, solubility, dan pKa eksperimental tidak selalu tersedia di PubChem PUG REST —
            cari nilai tersebut melalui tab Literature Search dan simpan sebagai Evidence.
          </p>
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-2">API Tersimpan di Proyek Ini</p>
        {apis.length === 0 ? (
          <p className="text-sm text-ink/50">Belum ada API tersimpan.</p>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr><th>Nama</th><th>PubChem CID</th><th>Formula</th></tr>
            </thead>
            <tbody>
              {apis.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td className="font-mono">{a.pubchem_cid ?? NA}</td>
                  <td className="font-mono">{a.molecular_formula ?? NA}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PropRow({ label, value, unit, mono }: { label: string; value: string | null; unit?: string; mono?: boolean }) {
  const isNA = !value || value === NA;
  return (
    <tr>
      <th className="w-56">{label}</th>
      <td className={mono ? "font-mono text-xs break-all" : ""}>
        {isNA ? <span className="text-ink/40 italic">{NA}</span> : `${value}${unit ? " " + unit : ""}`}
      </td>
    </tr>
  );
}
