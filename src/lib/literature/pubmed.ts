import type { LiteraturePaper } from "./types";

/**
 * NCBI E-utilities (PubMed) — https://www.ncbi.nlm.nih.gov/books/NBK25501/
 * Public, works without a key at a lower rate limit. Set NCBI_EUTILS_API_KEY
 * to raise the limit, and NCBI_EUTILS_EMAIL per NCBI's usage policy.
 */
const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export async function searchPubMed(query: string, limit = 15): Promise<LiteraturePaper[]> {
  const key = process.env.NCBI_EUTILS_API_KEY;
  const email = process.env.NCBI_EUTILS_EMAIL;

  const searchUrl = new URL(`${EUTILS}/esearch.fcgi`);
  searchUrl.searchParams.set("db", "pubmed");
  searchUrl.searchParams.set("term", query);
  searchUrl.searchParams.set("retmax", String(limit));
  searchUrl.searchParams.set("retmode", "json");
  if (key) searchUrl.searchParams.set("api_key", key);
  if (email) searchUrl.searchParams.set("email", email);

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) return [];
  const searchData = await searchRes.json();
  const ids: string[] = searchData?.esearchresult?.idlist ?? [];
  if (ids.length === 0) return [];

  const summaryUrl = new URL(`${EUTILS}/esummary.fcgi`);
  summaryUrl.searchParams.set("db", "pubmed");
  summaryUrl.searchParams.set("id", ids.join(","));
  summaryUrl.searchParams.set("retmode", "json");
  if (key) summaryUrl.searchParams.set("api_key", key);
  if (email) summaryUrl.searchParams.set("email", email);

  const summaryRes = await fetch(summaryUrl.toString());
  if (!summaryRes.ok) return [];
  const summaryData = await summaryRes.json();
  const result = summaryData?.result ?? {};

  return ids
    .map((id) => ({ id, r: result[id] }))
    .filter((entry) => Boolean(entry.r))
    .map(({ id, r }): LiteraturePaper => ({
      title: r.title ?? "Untitled",
      authors: (r.authors ?? []).map((a: any) => a.name),
      journal: r.fulljournalname ?? r.source ?? null,
      publicationYear: r.pubdate ? parseInt(r.pubdate.slice(0, 4), 10) || null : null,
      articleType: r.pubtype?.[0] ?? null,
      doi: r.elocationid?.startsWith("doi:") ? r.elocationid.replace("doi:", "").trim() : null,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      abstract: null, // esummary does not include abstracts; fetch efetch.fcgi per-article if needed
      isOpenAccess: false,
      sourceName: "PubMed",
      externalId: id
    }));
}
