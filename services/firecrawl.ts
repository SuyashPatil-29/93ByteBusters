import FirecrawlApp from "@mendable/firecrawl-js";

export type FirecrawlExtractResult = {
  success: boolean;
  data: any;
  error?: string;
};

export async function extractResearchPage(url: string, prompt: string): Promise<FirecrawlExtractResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return { success: false, data: null, error: "Missing FIRECRAWL_API_KEY env" };
  }

  const app = new FirecrawlApp({ apiKey });

  const res = await app.extract([url], { prompt });
  if (!res.success) {
    return { success: false, data: null, error: res.error };
  }
  return { success: true, data: res.data };
}

export async function extractImages(url: string): Promise<string[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  const images: string[] = [];
  try {
    if (apiKey) {
      const app = new FirecrawlApp({ apiKey });
      const res = await app.extract([url], {
        prompt:
          "List the most relevant image URLs for this page (maps, charts, figures). Respond strictly as JSON: {\"images\":[\"url\",...]}.",
      });
      if (res.success) {
        if (typeof res.data === "string") {
          try {
            const parsed = JSON.parse(res.data);
            if (Array.isArray(parsed?.images)) images.push(...parsed.images);
          } catch {}
        } else if (Array.isArray(res.data?.images)) {
          images.push(...res.data.images);
        }
      }
    }
  } catch {}

  // Fallback: fetch HTML and parse <img> tags
  if (images.length === 0) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await r.text();
      // 1) <meta property="og:image" />
      const og = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i.exec(html);
      if (og?.[1]) images.push(og[1]);

      // 2) <link rel="image_src" href="...">
      const linkRel = /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["'][^>]*>/i.exec(html);
      if (linkRel?.[1]) images.push(linkRel[1]);

      // 3) any <img> tags on page
      const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
      let m: RegExpExecArray | null;
      const found: string[] = [];
      while ((m = regex.exec(html)) && found.length < 10) {
        const src = m[1];
        if (src && !src.startsWith("data:")) found.push(src.startsWith("http") ? src : new URL(src, url).toString());
      }
      images.push(...found);
    } catch {}
  }

  // 4) Last-resort screenshot service (no API key required)
  if (images.length === 0) {
    try {
      const thum = `https://image.thum.io/get/width/1200/crop/800/${encodeURIComponent(url)}`;
      images.push(thum);
    } catch {}
  }

  return Array.from(new Set(images));
}

export type IngresGisData = {
  location?: {
    country?: string;
    state?: string;
    district?: string;
    block?: string;
    level?: string;
    name?: string;
    stateuuid?: string;
    locuuid?: string;
  };
  parameters?: {
    year?: string | number;
    component?: string;
    period?: string;
    category?: string;
    computationType?: string;
  };
  metrics?: Record<string, string | number>;
  tables?: Array<{ title?: string; rows: Array<Record<string, string>> }>;
  notes?: string;
};

export async function extractIngresGIS(url: string): Promise<FirecrawlExtractResult & { data: IngresGisData | null }> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return { success: false, data: null, error: "Missing FIRECRAWL_API_KEY env" };
  }

  const prompt = `You are extracting data from an INGRES GIS groundwater page.
Return STRICT JSON with keys: location, parameters, metrics, tables, notes.
- location: {country,state,district,block,level,name,stateuuid,locuuid} if visible
- parameters: {year,component,period,category,computationType}
- metrics: key numeric metrics shown (e.g., recharge, extraction, stage%). Ensure numbers where possible.
- tables: array of extracted key/value rows or visible tabular sections.
- notes: short text summary.
Do not include markdown. Do not include any extra commentary.`;

  try {
    const app = new FirecrawlApp({ apiKey });
    const res = await app.extract([url], { prompt });
    if (!res.success) return { success: false, data: null, error: res.error };
    let data: any = res.data;
    try {
      if (typeof data === "string") data = JSON.parse(data);
    } catch {}
    return { success: true, data: (data as IngresGisData) ?? null };
  } catch (e: any) {
    return { success: false, data: null, error: e?.message || "Firecrawl extract failed" };
  }
}


