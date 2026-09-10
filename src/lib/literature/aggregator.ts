import { searchEuropePMC } from "./europepmc";
import { searchCrossref } from "./crossref";
import { searchOpenAlex } from "./openalex";
import { searchPubMed } from "./pubmed";
import { dedupePapers, type LiteraturePaper, type LiteratureSearchFilters } from "./types";

const CLASSIC_CUTOFF_YEARS = 10; // "recent" window per spec section 7 default

const TYPE_PRIORITY: Record<string, number> = {
  "systematic-review": 1,
  systematic_review: 1,
  review: 2,
  "review-article": 2,
  "journal-article": 3,
  research_article: 3,
  dataset: 5,
  guideline: 4
};

export interface AggregatedSearchResult {
  papers: LiteraturePaper[];
  sourcesQueried: string[];
  sourcesFailed: string[];
}

/**
 * Queries PubMed, Europe PMC, Crossref, and OpenAlex in parallel
 * (spec section 6). Failures in one source never block the others —
 * partial results are returned with a note of which sources failed.
 */
export async function searchLiterature(
  query: string,
  filters: LiteratureSearchFilters = {},
  perSourceLimit = 15
): Promise<AggregatedSearchResult> {
  const sources: Array<{ name: string; fn: () => Promise<LiteraturePaper[]> }> = [
    { name: "PubMed", fn: () => searchPubMed(query, perSourceLimit) },
    { name: "Europe PMC", fn: () => searchEuropePMC(query, perSourceLimit) },
    { name: "Crossref", fn: () => searchCrossref(query, perSourceLimit) },
    { name: "OpenAlex", fn: () => searchOpenAlex(query, perSourceLimit) }
  ];

  const settled = await Promise.allSettled(sources.map((s) => s.fn()));
  const sourcesQueried: string[] = [];
  const sourcesFailed: string[] = [];
  let merged: LiteraturePaper[] = [];

  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      sourcesQueried.push(sources[i].name);
      merged = merged.concat(result.value);
    } else {
      sourcesFailed.push(sources[i].name);
    }
  });

  let papers = dedupePapers(merged);
  papers = applyFilters(papers, filters);
  papers = rankPapers(papers);

  return { papers, sourcesQueried, sourcesFailed };
}

function applyFilters(papers: LiteraturePaper[], filters: LiteratureSearchFilters): LiteraturePaper[] {
  const currentYear = new Date().getFullYear();
  return papers.filter((p) => {
    if (filters.onlyOpenAccess && !p.isOpenAccess) return false;
    if (filters.yearFrom && p.publicationYear && p.publicationYear < filters.yearFrom) return false;
    if (filters.yearTo && p.publicationYear && p.publicationYear > filters.yearTo) return false;
    if (filters.articleType && p.articleType !== filters.articleType) return false;

    if (filters.onlyRecent && !filters.includeClassic) {
      if (!p.publicationYear) return false;
      if (currentYear - p.publicationYear > CLASSIC_CUTOFF_YEARS) return false;
    }
    return true;
  });
}

/**
 * Ranking priority (spec section 6):
 * 1. Recent  2. Systematic review  3. Review  4. Research article
 * 5. Official database  6. Guideline  7. Old-but-fundamental
 */
function rankPapers(papers: LiteraturePaper[]): LiteraturePaper[] {
  const currentYear = new Date().getFullYear();
  return [...papers].sort((a, b) => {
    const typeScoreA = TYPE_PRIORITY[a.articleType ?? ""] ?? 4;
    const typeScoreB = TYPE_PRIORITY[b.articleType ?? ""] ?? 4;
    if (typeScoreA !== typeScoreB) return typeScoreA - typeScoreB;

    const yearA = a.publicationYear ?? 0;
    const yearB = b.publicationYear ?? 0;
    const recencyA = currentYear - yearA;
    const recencyB = currentYear - yearB;
    return recencyA - recencyB;
  });
}
