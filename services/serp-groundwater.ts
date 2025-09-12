import { getJson } from "serpapi";

export type GroundwaterSearchOptions = {
  num?: number;
  siteFilters?: string[];
  language?: string;
  country?: string;
};

export type GroundwaterSearchResult = {
  query: string;
  topStories: Array<{
    title: string;
    link: string;
    source?: string;
    date?: string;
    thumbnail?: string;
  }>;
  organicResults: Array<{
    title: string;
    link: string;
    snippet?: string;
    displayedLink?: string;
  }>;
  knowledgeGraph?: Record<string, any>;
};

export async function searchGroundwaterResearch(
  query: string,
  opts: GroundwaterSearchOptions = {}
): Promise<GroundwaterSearchResult> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("Missing SERPAPI_KEY env");

  const num = opts.num ?? 10;
  const sites = opts.siteFilters ?? [
    "ingres.iith.ac.in",
    "cgwb.gov.in",
    "jalshakti-dowr.gov.in",
    "jalshakti.gov.in",
    "doi.org",
  ];

  const siteQuery = sites.map((s) => `site:${s}`).join(" OR ");
  const fullQuery = `${query} groundwater India (${siteQuery})`;

  const searchParams: Record<string, any> = {
    api_key: apiKey,
    engine: "google",
    q: fullQuery,
    num,
    hl: opts.language ?? "en",
    gl: opts.country ?? "in",
  };

  const response = await getJson(searchParams as any);

  return {
    query: fullQuery,
    topStories: (response.top_stories || []).map((s: any) => ({
      title: s.title,
      link: s.link,
      source: s.source,
      date: s.date,
      thumbnail: s.thumbnail,
    })),
    organicResults: (response.organic_results || []).map((r: any) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
      displayedLink: r.displayed_link,
    })),
    knowledgeGraph: response.knowledge_graph || undefined,
  };
}


