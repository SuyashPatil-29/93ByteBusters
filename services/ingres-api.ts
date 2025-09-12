import { z } from "zod";
import { QueryParamsSchema, type GroundwaterAssessment } from "@/lib/groundwater";
import { INGRESLocationService, generateINGRESUrl, type LocationType } from "./ingres-location";
import { scrapeWithCache } from "./ingres-scraper";
import { logAudit } from "./audit";
import { incrMetric } from "@/lib/metrics";
import { cleanScrapedMarkdown } from "@/lib/markdown-clean";

export const NaturalQuerySchema = z.object({
  locationQuery: z.string().min(2),
  year: z.string().optional(),
  component: z.string().optional(),
});

export async function getGroundwaterStatus(params: z.infer<typeof NaturalQuerySchema>): Promise<GroundwaterAssessment> {
  const service = new INGRESLocationService();
  const { locationName, locationType } = await parseLocationQuery(params.locationQuery);
  const uuids = await service.findLocationUUIDs(locationName, locationType);
  if (!uuids) throw new Error("Location not found in INGRES system");

  const url = generateINGRESUrl(uuids, {
    locationName,
    locationType,
    year: params.year ?? "2024-2025",
    component: params.component ?? "recharge",
    period: "annual",
    category: "safe",
    mapOnClickParams: true,
  });

  let scraped: { html: string; markdown: string; usedUrl: string };
  try {
    scraped = await scrapeWithCache(url, {
      formats: ["html", "markdown"],
      forceRefresh: Boolean(process.env.FIRECRAWL_DEBUG),
    });
  } catch (e: any) {
    throw new Error(`Scrape failed for URL: ${url} :: ${e?.message ?? e}`);
  }

  const metrics = extractGroundwaterData(scraped.html || scraped.markdown);
  // If markdown is empty but html exists, derive a plain-text markdown fallback so UI shows something
  let rawMarkdown = scraped.markdown;
  if ((!rawMarkdown || rawMarkdown.trim().length === 0) && scraped.html && scraped.html.trim().length > 0) {
    const text = stripHtml(scraped.html);
    rawMarkdown = text;
  }
  if (rawMarkdown) {
    rawMarkdown = cleanScrapedMarkdown(rawMarkdown);
  }

  await incrMetric('status.fetch.success');
  await logAudit('getGroundwaterStatus', { locationName, locationType, url });

  return {
    locationName,
    locationType,
    year: params.year ?? "2024-2025",
    metrics,
    sourceUrl: scraped.usedUrl ?? url,
    rawHtml: scraped.html,
    rawMarkdown,
  };
}

export async function queryINGRES(raw: unknown) {
  const parsed = QueryParamsSchema.parse(raw);
  const service = new INGRESLocationService();
  const uuids = await service.findLocationUUIDs(parsed.locationName, parsed.locationType);
  if (!uuids) throw new Error("Location not found in INGRES system");
  const url = generateINGRESUrl(uuids, parsed);
  let scraped: { html: string; markdown: string; usedUrl: string };
  try {
    scraped = await scrapeWithCache(url, { formats: ["html", "markdown"], forceRefresh: Boolean(process.env.FIRECRAWL_DEBUG) });
  } catch (e: any) {
    throw new Error(`Scrape failed for URL: ${url} :: ${e?.message ?? e}`);
  }
  await logAudit("queryINGRES", { args: parsed, url });
  return { url: scraped.usedUrl ?? url, scraped };
}

export async function parseLocationQuery(query: string): Promise<{ locationName: string; locationType: LocationType }> {
  // Minimal heuristic; can be enhanced later with database-backed detection
  const q = query.toLowerCase();
  const normalized = normalizeLocationName(query);
  // If contains keywords like state, district, block
  if (/(state|karnataka|maharashtra|uttar|pradesh|tamil|nadu)/.test(q)) {
    return { locationName: capitalizeWords(normalized), locationType: "STATE" };
  }
  return { locationName: capitalizeWords(normalized), locationType: "DISTRICT" };
}

function capitalizeWords(input: string) {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizeLocationName(input: string): string {
  const t = input.trim().toLowerCase();
  if (t === 'bangalore' || t === 'bangalore urban' || t === 'bengaluru urban' || t === 'bengaluru (urban)') return 'Bengaluru (Urban)';
  if (t === 'mysore') return 'mysuru';
  return input;
}

function extractGroundwaterData(htmlOrMd: string): Record<string, string | number> {
  const metrics: Record<string, string | number> = {};
  // 1) Simple colon pairs like "Recharge: 123"
  const pairs = htmlOrMd.match(/([A-Za-z ][A-Za-z ()\/]{2,}?):\s*([0-9.,%A-Za-z]+)/g) || [];
  for (const p of pairs) {
    const m = p.split(":");
    if (m.length >= 2) metrics[m[0].trim()] = m.slice(1).join(":").trim();
  }

  // 2) Markdown table rows like "| Recharge | 123 |"
  const mdRows = htmlOrMd.match(/\|\s*([A-Za-z ()\/]+?)\s*\|\s*([0-9.,%A-Za-z]+)\s*\|/g) || [];
  for (const row of mdRows) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2) metrics[cells[0]] = cells[1];
  }

  // 3) HTML table cells: <td>Label</td><td>Value</td>
  const htmlRows = htmlOrMd.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  for (const tr of htmlRows) {
    const tds = tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];
    if (tds.length >= 2) {
      const label = stripHtml(tds[0] || '');
      const value = stripHtml(tds[1] || '');
      if (label && value) metrics[normalizeLabel(label)] = value.trim();
    }
  }

  // 4) Ensure some canonical keys if present anywhere
  const text = stripHtml(htmlOrMd).toLowerCase();
  const tryCapture = (key: string, patterns: RegExp[]) => {
    if (metrics[key]) return;
    for (const re of patterns) {
      const m = text.match(re);
      if (m?.[1]) { metrics[key] = m[1].trim(); break; }
    }
  };
  tryCapture('Recharge', [/recharge[^0-9]*([0-9.,]+)%?/]);
  tryCapture('Extraction', [/extraction[^0-9]*([0-9.,]+)%?/]);
  tryCapture('Stage of GW Development', [/stage[^0-9]*([0-9.,]+)%/]);

  return metrics;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function normalizeLabel(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}


