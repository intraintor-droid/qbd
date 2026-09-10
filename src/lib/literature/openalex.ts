import type { LiteraturePaper } from "./types";

/**
 * OpenAlex API — https://docs.openalex.org
 * Public, no key required. Excellent citation graph + open-access flags.
 */
export async function searchOpenAlex(query: string, limit = 15): Promise<LiteraturePaper[]> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per_page", String(limit));
  const mailto = process.env.CROSSREF_MAILTO; // reuse contact email for OpenAlex's polite pool too
  if (mailto) url.searchParams.set("mailto", mailto);

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  const results = data?.results ?? [];

  return results.map((w: any): LiteraturePaper => ({
    title: w.title ?? w.display_name ?? "Untitled",
    authors: (w.authorships ?? []).map((a: any) => a.author?.display_name).filter(Boolean),
    journal: w.primary_location?.source?.display_name ?? null,
    publicationYear: w.publication_year ?? null,
    articleType: w.type ?? null,
    doi: w.doi ? w.doi.replace("https://doi.org/", "") : null,
    url: w.doi ?? w.primary_location?.landing_page_url ?? null,
    abstract: reconstructAbstract(w.abstract_inverted_index),
    isOpenAccess: Boolean(w.open_access?.is_oa),
    sourceName: "OpenAlex",
    externalId: w.id ?? null
  }));
}

/** OpenAlex returns abstracts as an inverted index (word -> positions); reassemble to plain text. */
function reconstructAbstract(inverted?: Record<string, number[]>): string | null {
  if (!inverted) return null;
  const positions: Array<[number, string]> = [];
  for (const [word, idxs] of Object.entries(inverted)) {
    for (const i of idxs) positions.push([i, word]);
  }
  positions.sort((a, b) => a[0] - b[0]);
  return positions.map(([, w]) => w).join(" ");
}
