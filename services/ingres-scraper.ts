import { prisma, ensureDb } from "@/lib/prisma";
import { getFirecrawl, scrapeViaApi, scrapeViaSdk } from "./firecrawl";
import { kv } from "@vercel/kv";

export async function scrapeWithCache(url: string, options?: {
  formats?: Array<"html" | "markdown">;
  includeTags?: string[];
  ttlSeconds?: number;
  forceRefresh?: boolean;
}): Promise<{ html: string; markdown: string; usedUrl: string }> {
  const DEBUG = true;
  const dbg = (...args: any[]) => { if (DEBUG) console.log("[firecrawl]", ...args); };
  const ttlSeconds = options?.ttlSeconds ?? 21600;
  const forceRefresh = options?.forceRefresh ?? false;

  // Try KV first if available
  if (!forceRefresh) {
    try {
      const kvKey = `scrape:${url}`;
      const kvHit = await kv.get<{ html?: string; markdown?: string; ts: number; ttl: number }>(kvKey);
      if (kvHit) {
        const ageSeconds = (Date.now() - kvHit.ts) / 1000;
        if (ageSeconds < (kvHit.ttl ?? ttlSeconds)) {
          dbg("KV hit", { url, ageSeconds });
          return { html: kvHit.html ?? "", markdown: kvHit.markdown ?? "", usedUrl: url };
        }
      }
    } catch {}
  }

  // Fallback to Prisma cache
  if (!forceRefresh) {
    try {
      await ensureDb();
      const existing = await prisma.scrapeCache.findUnique({ where: { url } });
      if (existing) {
        const ageSeconds = (Date.now() - new Date(existing.lastFetched).getTime()) / 1000;
        if (ageSeconds < existing.ttlSeconds) {
          dbg("Prisma cache hit", { url, ageSeconds });
          return { html: existing.contentHtml ?? "", markdown: existing.contentMd ?? "", usedUrl: url };
        }
      }
    } catch {}
  }

  // Scrape fresh (with fallback URL normalization)
  const firecrawl = getFirecrawl();
  async function tryScrape(targetUrl: string) {
    const preferRest = targetUrl.includes(';');
    const doRest = async () => {
      try {
        dbg("REST /v2/scrape", targetUrl);
        const t0 = Date.now();
        const res = await scrapeViaApi({
          url: targetUrl,
          formats: options?.formats ?? ["html", "markdown"],
          onlyMainContent: true,
          maxAgeMs: (options?.ttlSeconds ?? 21600) * 1000,
          waitForMs: 10000,
        });
        dbg("REST /v2/scrape done", { ms: Date.now() - t0, md: res.markdown?.length ?? 0, html: res.html?.length ?? 0 });
        return res;
      } catch (e: any) { dbg("REST /v2/scrape failed", e?.message ?? e); throw e; }
    };
    const doSdk = async () => {
      try {
        dbg("SDK scrape()", targetUrl);
        const t0 = Date.now();
        const res = await scrapeViaSdk({ url: targetUrl, formats: options?.formats ?? ["markdown", "html"], onlyMainContent: true });
        dbg("SDK scrape() done", { ms: Date.now() - t0, md: res.markdown?.length ?? 0, html: res.html?.length ?? 0 });
        return res;
      } catch (e: any) { dbg("SDK scrape() failed", e?.message ?? e); throw e; }
    };

    if (preferRest) {
      try { return await doRest(); } catch {}
      try { return await doSdk(); } catch {}
    } else {
      try { return await doSdk(); } catch {}
      try { return await doRest(); } catch {}
    }
    // Legacy SDK direct as last resort
    dbg("SDK scrapeUrl()", targetUrl);
    const t0 = Date.now();
    const res = await (firecrawl as any).scrapeUrl({
      url: targetUrl,
      formats: options?.formats ?? ["html", "markdown"],
      includeTags: options?.includeTags,
      waitFor: 6000,
      onlyMainContent: true,
    } as any);
    dbg("SDK scrapeUrl() done", { ms: Date.now() - t0, md: (res as any)?.markdown?.length ?? 0, html: (res as any)?.html?.length ?? 0 });
    return res;
  }
  async function tryDirectFetch(targetUrl: string) {
    const res = await fetch(targetUrl, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) {
      throw new Error(`fetch(${res.status})`);
    }
    const html = await res.text();
    return { html, markdown: '' };
  }

  let usedUrl = url;
  let result: any;
  let html: string | undefined;
  let markdown: string | undefined;
  try {
    result = await tryScrape(url);
    html = (result as any)?.html as string | undefined;
    markdown = (result as any)?.markdown as string | undefined;
  } catch (e: any) {
    // First attempt threw (likely 400 due to semicolons). Try altUrl.
    const altUrl = toQueryUrl(url);
    if (altUrl !== url) {
      try {
        usedUrl = altUrl;
        result = await tryScrape(altUrl);
        html = (result as any)?.html as string | undefined;
        markdown = (result as any)?.markdown as string | undefined;
      } catch (e2: any) {
        // Try direct fetch fallbacks before giving up
        try {
          dbg("direct fetch alt", altUrl);
          const directAlt = await tryDirectFetch(altUrl);
          usedUrl = altUrl;
          html = directAlt.html;
          markdown = directAlt.markdown;
        } catch (eAltDirect: any) {
          try {
            dbg("direct fetch orig", url);
            const directOrig = await tryDirectFetch(url);
            usedUrl = url;
            html = directOrig.html;
            markdown = directOrig.markdown;
          } catch (eOrigDirect: any) {
            throw new Error(`${e?.message ?? e} | tried: ${url} | alt failed: ${e2?.message ?? e2} (${altUrl}) | direct alt failed: ${eAltDirect?.message ?? eAltDirect} | direct orig failed: ${eOrigDirect?.message ?? eOrigDirect}`);
          }
        }
      }
    } else {
      throw e;
    }
  }

  if (!html && !markdown) {
    // Fallback: convert semicolon params to query string if applicable
    const altUrl = toQueryUrl(url);
    if (altUrl !== url) {
      usedUrl = altUrl;
      try {
        result = await tryScrape(altUrl);
        html = (result as any)?.html as string | undefined;
        markdown = (result as any)?.markdown as string | undefined;
      } catch (e: any) {
        // Try a direct fetch before giving up
        try {
          dbg("direct fetch alt (no content)", altUrl);
          const direct = await tryDirectFetch(altUrl);
          html = direct.html;
          markdown = direct.markdown;
        } catch (e2: any) {
          throw new Error(`${typeof (result as any)?.error === "string" ? (result as any)?.error : JSON.stringify((result as any)?.error)} | tried: ${url} | alt: ${altUrl} | direct failed: ${e2?.message ?? e2}`);
        }
      }
      if (!html && !markdown) {
        // Last fallback: direct fetch on original
        try {
          usedUrl = url;
          dbg("direct fetch orig (no content)", url);
          const direct = await tryDirectFetch(url);
          html = direct.html;
          markdown = direct.markdown;
        } catch (e3: any) {
          const err = (result as any)?.error || "FireCrawl scrape failed";
          throw new Error(`${typeof err === "string" ? err : JSON.stringify(err)} | tried: ${url} | alt: ${altUrl} | direct failed: ${e3?.message ?? e3}`);
        }
      }
    } else {
      const err = (result as any)?.error || "FireCrawl scrape failed";
      throw new Error(`${typeof err === "string" ? err : JSON.stringify(err)} | tried: ${url}`);
    }
  }

  // Write KV (best-effort)
  try {
    const kvKey = `scrape:${url}`;
    await kv.set(kvKey, { html: html ?? "", markdown: markdown ?? "", ts: Date.now(), ttl: ttlSeconds });
    await kv.expire(kvKey, ttlSeconds);
    dbg("KV write", { url, usedUrl, sizes: { md: markdown?.length ?? 0, html: html?.length ?? 0 } });
  } catch {}

  // Persist Prisma cache
  try {
    await prisma.scrapeCache.upsert({
      where: { url },
      create: {
        url,
        contentHtml: html ?? null,
        contentMd: markdown ?? null,
        ttlSeconds,
      },
      update: {
        contentHtml: html ?? null,
        contentMd: markdown ?? null,
        lastFetched: new Date(),
        ttlSeconds,
      },
    });
    dbg("Prisma cache write", { url, usedUrl });
  } catch {}

  dbg("scrapeWithCache done", { usedUrl, sizes: { md: markdown?.length ?? 0, html: html?.length ?? 0 } });
  return { html: html ?? "", markdown: markdown ?? "", usedUrl };
}

function toQueryUrl(u: string): string {
  // If URL contains ';' parameters, convert to ?a=b&c=d format
  const idx = u.indexOf(';');
  if (idx === -1) return u;
  const base = u.slice(0, idx);
  const rest = u.slice(idx + 1);
  const parts = rest.split(';').filter(Boolean);
  const qs = parts.join('&');
  return `${base}?${qs}`;
}


