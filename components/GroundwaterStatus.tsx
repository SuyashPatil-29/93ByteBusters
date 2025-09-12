"use client";
import React from "react";
import { Markdown } from "./markdown";
import { MarkdownTableView, type TableSection } from "./MarkdownTableView";
import { Table, TableBody, TableRow, TableHead, TableHeader, TableCell } from "@/components/ui/table";

export function GroundwaterStatus({
  data,
}: {
  data: { locationName: string; locationType: string; year: string; metrics: Record<string, string | number>; sourceUrl: string; rawMarkdown?: string; rawHtml?: string };
}) {
  const imageUrls = extractAllImageUrls(data.rawMarkdown || "", data.rawHtml || "");
  const markdownWithoutImages = removeImagesFromMarkdown(data.rawMarkdown || "");
  const sections = React.useMemo(() => parseMarkdownTablesOnly(markdownWithoutImages), [markdownWithoutImages]);
  const kv = React.useMemo(() => extractKeyValuePairs(markdownWithoutImages), [markdownWithoutImages]);
  const areaOfFocus = kv.get("Area of Focus") || kv.get("Area of Focus :") || "";
  const yearText = kv.get("YEAR") || kv.get("Assessment year") || kv.get("Year") || data.year;
  const categoryRaw = (kv.get("Category") || kv.get("Category :") || (typeof data.metrics?.["Category"] === 'string' ? (data.metrics as any)["Category"] : '')) as string | undefined;
  const categoryDetected = categoryRaw && categoryRaw.trim().length > 0 ? categoryRaw : detectCategoryFromText(markdownWithoutImages);
  const category = (categoryDetected || '').toString().trim();
  const categoryStyle = getCategoryStyle(category);
  const summaryRows: Array<[string, string]> = [];
  const pushIf = (k: string, label: string) => {
    const v = kv.get(k);
    if (v && String(v).trim().length > 0) summaryRows.push([label, String(v)]);
  };
  pushIf("Rainfall (mm)", "Rainfall (mm)");
  pushIf("Ground Water Recharge (ham)", "Ground Water Recharge (ham)");
  pushIf("Natural Discharges (ham)", "Natural Discharges (ham)");
  pushIf("Annual Extractable Ground Water Resources (ham)", "Annual Extractable Ground Water Resources (ham)");
  pushIf("Ground Water Extraction (ham)", "Ground Water Extraction (ham)");
  return (
    <div className="space-y-3">
      {(areaOfFocus || yearText || category) ? (
        <div className="rounded border p-3 bg-white">
          {areaOfFocus ? (
            <div className="text-sm"><span className="font-medium">Area of Focus</span> {areaOfFocus}</div>
          ) : null}
          {yearText ? (
            <div className="text-sm"><span className="font-medium">YEAR</span> {yearText}</div>
          ) : null}
          {category ? (
            <div className="text-sm flex items-center gap-2">
              <span className="font-medium">Category</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryStyle}`}>{category}</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {imageUrls.length > 0 ? (
        <details className="rounded border p-3 bg-white">
          <summary className="cursor-pointer text-sm text-blue-600 hover:underline">Show photos ({imageUrls.length})</summary>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            {imageUrls.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={`${src}-${i}`} src={src} alt={`photo-${i + 1}`} className="w-full h-auto rounded border" loading="lazy" />
            ))}
          </div>
        </details>
      ) : null}
      {summaryRows.length > 0 ? (
        <div className="rounded border p-3 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryRows.map(([k, v]) => (
                <TableRow key={k}>
                  <TableCell>{k}</TableCell>
                  <TableCell>{v}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
      {sections.length > 0 ? (
        <MarkdownTableView sections={sections} />
      ) : markdownWithoutImages.trim().length > 0 ? (
        <Markdown>{markdownWithoutImages}</Markdown>
      ) : null}
    </div>
  );
}

function extractAllImageUrls(markdown: string, html: string): string[] {
  const urls = new Set<string>();
  // Markdown images ![alt](url)
  const mdImg = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m: RegExpExecArray | null;
  while ((m = mdImg.exec(markdown)) !== null) {
    if (m[1]) urls.add(m[1]);
  }
  // HTML <img src="...">
  const htmlImg = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  while ((m = htmlImg.exec(html)) !== null) {
    if (m[1]) urls.add(m[1]);
  }
  return Array.from(urls);
}

function removeImagesFromMarkdown(md: string): string {
  if (!md) return "";
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // markdown images
    .replace(/<img[^>]*>/gi, "") // html img tags
    .trim();
}

function parseMarkdownTablesOnly(md: string): TableSection[] {
  if (!md || md.trim().length === 0) return [];
  const lines = md.split(/\r?\n/).map((l) => l.trim());
  const tables: TableSection[] = [];
  let i = 0;
  const parseRow = (s: string) => s.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
  while (i < lines.length) {
    if (lines[i].startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const header = parseRow(tableLines[0] || '');
      let dataStart = 1;
      if (tableLines[1] && /:-{2,}|-{3,}:?/.test(tableLines[1])) dataStart = 2;
      const rows = tableLines.slice(dataStart).map(parseRow);
      tables.push({ title: `Table ${tables.length + 1}`, columns: header, rows });
      continue;
    }
    i++;
  }
  return tables;
}

function extractKeyValuePairs(md: string): Map<string, string> {
  const map = new Map<string, string>();
  const lines = md.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('[')) continue; // skip link-only lines
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key && val && !/^https?:\/\//i.test(key)) {
      map.set(key, val);
    }
  }
  return map;
}

function getCategoryStyle(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('over') || c.includes('exploited')) return 'bg-red-100 text-red-700';
  if (c.includes('critical')) return 'bg-orange-100 text-orange-700';
  if (c.includes('semi')) return 'bg-amber-100 text-amber-700';
  if (c.includes('safe')) return 'bg-green-100 text-green-700';
  return 'bg-zinc-100 text-zinc-700';
}

function detectCategoryFromText(md: string): string {
  if (!md) return '';
  const text = md.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
  // Direct pattern: Category: <value>
  const m1 = text.match(/category\s*[:\-]?\s*(over[-\s]?exploited|critical|semi[-\s]?critical|safe)/i);
  if (m1?.[1]) return normalizeCategory(m1[1]);

  // Heading followed by value (within next few words)
  const m2 = md.match(/\bCategory\b[\s\n\r]*([A-Za-z\- ]{3,20})/i);
  if (m2?.[1]) {
    const v = m2[1].trim();
    const m = v.match(/(over[-\s]?exploited|critical|semi[-\s]?critical|safe)/i);
    if (m?.[1]) return normalizeCategory(m[1]);
  }

  // Fallback: pick the highest-severity term mentioned anywhere
  const order = [
    /over[-\s]?exploited/i,
    /critical/i,
    /semi[-\s]?critical/i,
    /safe/i,
  ];
  for (const re of order) {
    if (re.test(md)) {
      const m = md.match(re);
      if (m?.[0]) return normalizeCategory(m[0]);
    }
  }
  return '';
}

function normalizeCategory(s: string): string {
  const t = s.toLowerCase().replace(/\s+/g, '-');
  if (t.includes('over')) return 'Over-Exploited';
  if (t.includes('semi')) return 'Semi-Critical';
  if (t.includes('critical')) return 'Critical';
  if (t.includes('safe')) return 'Safe';
  return s;
}


