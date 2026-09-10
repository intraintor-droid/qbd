import type { LiteraturePaper } from "./types";

/**
 * Crossref REST API — https://api.crossref.org
 * Public, no key required. Set CROSSREF_MAILTO for the "polite pool"
 * (higher rate limits, per Crossref's etiquette guidelines).
 */
export async function searchCrossref(query: string, limit = 15): Promise<LiteraturePaper[]> {
  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("query", query);
  url.searchParams.set("rows", String(limit));
  url.searchParams.set("sort", "relevance");
  const mailto = process.env.CROSSREF_MAILTO;
  if (mailto) url.searchParams.set("mailto", mailto);

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  const items = data?.message?.items ?? [];

  return items.map((it: any): LiteraturePaper => ({
    title: Array.isArray(it.title) ? it.title[0] ?? "Untitled" : it.title ?? "Untitled",
    authors: (it.author ?? []).map((a: any) => [a.given, a.family].filter(Boolean).join(" ")),
    journal: Array.isArray(it["container-title"]) ? it["container-title"][0] ?? null : null,
    publicationYear:
      it["published-print"]?.["date-parts"]?.[0]?.[0] ??
      it["published-online"]?.["date-parts"]?.[0]?.[0] ??
      null,
    articleType: it.type ?? null,
    doi: it.DOI ?? null,
    url: it.URL ?? (it.DOI ? `https://doi.org/${it.DOI}` : null),
    abstract: it.abstract ? it.abstract.replace(/<[^>]+>/g, "") : null,
    isOpenAccess: Boolean(it.license && it.license.length > 0),
    sourceName: "Crossref",
    externalId: it.DOI ?? null
  }));
}
