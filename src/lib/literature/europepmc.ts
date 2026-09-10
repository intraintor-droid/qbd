import type { LiteraturePaper } from "./types";

/**
 * Europe PMC REST API — https://europepmc.org/RestfulWebService
 * Public, no API key required. Good open-access coverage.
 */
export async function searchEuropePMC(query: string, limit = 15): Promise<LiteraturePaper[]> {
  const url = new URL("https://www.ebi.ac.uk/europepmc/webservices/rest/search");
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("pageSize", String(limit));
  url.searchParams.set("resultType", "core");

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  const results = data?.resultList?.result ?? [];

  return results.map(
    (r: any): LiteraturePaper => ({
      title: r.title ?? "Untitled",
      authors: r.authorString ? r.authorString.split(", ") : [],
      journal: r.journalTitle ?? null,
      publicationYear: r.pubYear ? Number(r.pubYear) : null,
      articleType: r.pubType ?? null,
      doi: r.doi ?? null,
      url: r.doi ? `https://doi.org/${r.doi}` : r.fullTextUrlList?.fullTextUrl?.[0]?.url ?? null,
      abstract: r.abstractText ?? null,
      isOpenAccess: r.isOpenAccess === "Y",
      sourceName: "Europe PMC",
      externalId: r.id ?? null
    })
  );
}
