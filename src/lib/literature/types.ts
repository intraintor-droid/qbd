export interface LiteraturePaper {
  title: string;
  authors: string[];
  journal: string | null;
  publicationYear: number | null;
  articleType: string | null;
  doi: string | null;
  url: string | null;
  abstract: string | null;
  isOpenAccess: boolean;
  sourceName: "PubMed" | "Europe PMC" | "Crossref" | "OpenAlex" | "Semantic Scholar";
  externalId: string | null;
}

/** De-duplicate a merged result set by DOI first, falling back to normalized title. */
export function dedupePapers(papers: LiteraturePaper[]): LiteraturePaper[] {
  const seen = new Set<string>();
  const out: LiteraturePaper[] = [];
  for (const p of papers) {
    const key = (p.doi ?? p.title.toLowerCase().replace(/[^a-z0-9]/g, "")).trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

export interface LiteratureSearchFilters {
  yearFrom?: number;
  yearTo?: number;
  onlyOpenAccess?: boolean;
  onlyRecent?: boolean; // last 5-10 years
  includeClassic?: boolean; // allow older foundational papers through even if onlyRecent
  articleType?: string;
}
