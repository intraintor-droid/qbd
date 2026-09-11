/**
 * PubChem PUG REST integration (spec section 5).
 * Every value returned carries its source. If PubChem has no value
 * for a property, we return null and the UI must render
 * "TIDAK DITEMUKAN" — never an estimated number without that label.
 */

const BASE = (process.env.PUBCHEM_API_URL ?? "https://pubchem.ncbi.nlm.nih.gov/rest/pug").replace(/\/$/, "");
const REQUEST_TIMEOUT_MS = 15_000;

export interface PubChemProperties {
  cid: string;
  molecularWeight: string | null;
  molecularFormula: string | null;
  canonicalSmiles: string | null;
  isomericSmiles: string | null;
  inchi: string | null;
  inchiKey: string | null;
  xLogP: string | null;
  hBondDonorCount: string | null;
  hBondAcceptorCount: string | null;
  rotatableBondCount: string | null;
  tpsa: string | null;
  formalCharge: string | null;
  complexity: string | null;
  exactMass: string | null;
  monoisotopicMass: string | null;
  sourceUrl: string;
}

const PROPERTY_LIST = [
  "MolecularWeight", "MolecularFormula", "CanonicalSMILES", "IsomericSMILES", "InChI", "InChIKey",
  "XLogP", "HBondDonorCount", "HBondAcceptorCount", "RotatableBondCount", "TPSA", "Charge",
  "Complexity", "ExactMass", "MonoisotopicMass"
].join(",");

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function findCidByName(name: string): Promise<string | null> {
  const res = await fetchWithTimeout(`${BASE}/compound/name/${encodeURIComponent(name)}/cids/JSON`);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.IdentifierList?.CID?.[0]?.toString() ?? null;
}

const NA = null;

export async function getPubChemProfile(query: {
  name?: string;
  cid?: string;
}): Promise<PubChemProperties | { error: string }> {
  let cid = query.cid ?? null;
  if (!cid && query.name) cid = await findCidByName(query.name);
  if (!cid) return { error: "TIDAK DITEMUKAN — compound not found in PubChem." };

  const propRes = await fetchWithTimeout(`${BASE}/compound/cid/${encodeURIComponent(cid)}/property/${PROPERTY_LIST}/JSON`);
  if (!propRes.ok) return { error: `PubChem request failed (${propRes.status})` };
  const propData = await propRes.json();
  const p = propData?.PropertyTable?.Properties?.[0] ?? {};

  return {
    cid,
    molecularWeight: p.MolecularWeight?.toString() ?? NA,
    molecularFormula: p.MolecularFormula ?? NA,
    canonicalSmiles: p.CanonicalSMILES ?? NA,
    isomericSmiles: p.IsomericSMILES ?? NA,
    inchi: p.InChI ?? NA,
    inchiKey: p.InChIKey ?? NA,
    xLogP: p.XLogP?.toString() ?? NA,
    hBondDonorCount: p.HBondDonorCount?.toString() ?? NA,
    hBondAcceptorCount: p.HBondAcceptorCount?.toString() ?? NA,
    rotatableBondCount: p.RotatableBondCount?.toString() ?? NA,
    tpsa: p.TPSA?.toString() ?? NA,
    formalCharge: p.Charge?.toString() ?? NA,
    complexity: p.Complexity?.toString() ?? NA,
    exactMass: p.ExactMass?.toString() ?? NA,
    monoisotopicMass: p.MonoisotopicMass?.toString() ?? NA,
    sourceUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${encodeURIComponent(cid)}`
  };
}

/** Search PubChem by name/synonym and return candidate CIDs for a disambiguation picker. */
export async function searchPubChemCandidates(name: string): Promise<Array<{ cid: string; title: string }>> {
  const cidRes = await fetchWithTimeout(`${BASE}/compound/name/${encodeURIComponent(name)}/cids/JSON`);
  if (!cidRes.ok) return [];
  const cidData = await cidRes.json();
  const cids: number[] = cidData?.IdentifierList?.CID ?? [];
  if (cids.length === 0) return [];

  const top = cids.slice(0, 5);
  const titleRes = await fetchWithTimeout(`${BASE}/compound/cid/${top.map(String).join(",")}/property/Title/JSON`);
  if (!titleRes.ok) return top.map((c) => ({ cid: c.toString(), title: `CID ${c}` }));
  const titleData = await titleRes.json();
  const props = titleData?.PropertyTable?.Properties ?? [];
  return props.map((p: { CID: number; Title?: string }) => ({
    cid: p.CID.toString(),
    title: p.Title ?? `CID ${p.CID}`
  }));
}
