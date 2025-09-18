import FirecrawlApp from "@mendable/firecrawl-js";

let firecrawlSingleton: FirecrawlApp | null = null;

export function getFirecrawl(): FirecrawlApp {
  if (!firecrawlSingleton) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    firecrawlSingleton = new FirecrawlApp({ apiKey });
  }
  return firecrawlSingleton!;
}

export async function scrapeViaSdk(args: {
  url: string;
  formats?: Array<"html" | "markdown">;
  onlyMainContent?: boolean;
  waitForMs?: number;
}): Promise<{ html?: string; markdown?: string }> {
  console.log('scrapeViaSdk', args);
  const fc = getFirecrawl() as any;
  // New SDK (preferred)
  if (typeof fc.scrape === 'function') {
    const res = await fc.scrape(args.url, {
      formats: args.formats ?? ["markdown", "html"],
      onlyMainContent: args.onlyMainContent ?? false,
      waitFor: typeof args.waitForMs === 'number' ? args.waitForMs : 20000,
    });
    const data: any = res ?? {};
    console.log('scrapeViaSdk data', data);
    return {
      markdown: (data as any)?.markdown ?? (data as any)?.data?.markdown ?? (data as any)?.data?.[0]?.markdown,
      html: (data as any)?.html ?? (data as any)?.data?.html ?? (data as any)?.data?.[0]?.html,
    };
  }
  // Legacy SDK
  if (typeof fc.scrapeUrl === 'function') {
    const res = await fc.scrapeUrl({
      url: args.url,
      formats: args.formats ?? ["html", "markdown"],
      onlyMainContent: args.onlyMainContent ?? false,
      waitFor: typeof args.waitForMs === 'number' ? args.waitForMs : 20000,
    });
    return { html: (res as any)?.html, markdown: (res as any)?.markdown };
  }
  throw new Error('FireCrawl SDK does not expose scrape() or scrapeUrl()');
}

export async function scrapeViaApi(args: {
  url: string;
  formats?: Array<"html" | "markdown">;
  onlyMainContent?: boolean;
  maxAgeMs?: number;
  includeTags?: string[];
  waitForMs?: number;
}): Promise<{ html?: string; markdown?: string }> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not set");
  const endpoint = "https://api.firecrawl.dev/v2/scrape";
  const body: any = {
    url: args.url,
    onlyMainContent: args.onlyMainContent ?? false,
    maxAge: typeof args.maxAgeMs === "number" ? args.maxAgeMs : 0,
    parsers: [],
    formats: args.formats ?? ["html", "markdown"],
  };
  if (Array.isArray(args.includeTags) && args.includeTags.length > 0) {
    (body as any).includeTags = args.includeTags;
  }
  (body as any).waitFor = typeof args.waitForMs === 'number' ? args.waitForMs : 20000;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`firecrawl api ${res.status}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }
  // FireCrawl may return in a few different shapes depending on options/version.
  // Try a series of robust extractions.
  const anyData: any = data;
  const tryPaths = (obj: any, paths: string[]): string | undefined => {
    for (const p of paths) {
      const parts = p.split(".");
      let v: any = obj;
      for (const part of parts) {
        if (v == null) break;
        if (part === '[0]') v = Array.isArray(v) ? v[0] : undefined; else v = v[part];
      }
      if (typeof v === 'string' && v.trim().length > 0) return v;
    }
    return undefined;
  };

  const markdown = tryPaths(anyData, [
    'markdown',
    'data.markdown',
    'data[0].markdown',
    'data.content',
    'data[0].content',
    'result.markdown',
    'results[0].markdown',
  ]);
  const html = tryPaths(anyData, [
    'html',
    'data.html',
    'data[0].html',
  ]);
  return { html, markdown };
}


