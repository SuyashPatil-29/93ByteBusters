import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const TableSchema = z.object({
  title: z.string().optional(),
  columns: z.array(z.string()).min(2),
  rows: z.array(z.array(z.union([z.string(), z.number()]))),
});

export const ReportSchema = z.object({
  areaOfFocus: z.string().optional(),
  year: z.string().optional(),
  metrics: z
    .array(
      z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        unit: z.string().optional(),
      })
    )
    .optional(),
  tables: z.array(TableSchema).optional(),
});

function stripNonValuable(md: string): string {
  // Drop images and code blocks entirely
  let x = md.replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  x = x.replace(/```[\s\S]*?```/g, "");
  // Drop obvious UI/footer bits
  x = x.replace(/Visitors:[\s\S]*?(\n\n|$)/gi, "");
  x = x.replace(/Powered by:[\s\S]*?(\n\n|$)/gi, "");
  x = x.replace(/Developed by:[\s\S]*?(\n\n|$)/gi, "");
  // Normalize whitespace and truncate (LLM cost)
  x = x.replace(/\n{3,}/g, "\n\n").trim();
  const MAX = 6000; // characters
  if (x.length > MAX) x = x.slice(0, MAX);
  return x;
}

export async function summarizeGroundwaterMarkdownToTable(markdown: string) {
  const content = stripNonValuable(markdown);
  const system = `You are a data formatter. Given scraped markdown about groundwater assessment, extract a concise table of the most decision-useful metrics.
- Prefer numeric metrics and short labels (e.g., Recharge (ham), Extraction (ham), Rainfall (mm)).
- If a per-subregion table exists (e.g., TALUK rows), include it with 3-4 key columns.
- Do not invent values. Omit empty rows.
- Return ONLY the JSON according to the provided schema.`;

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    system,
    prompt: content,
    schema: TableSchema,
  });

  return object as z.infer<typeof TableSchema>;
}

export async function summarizeGroundwaterMarkdown(markdown: string) {
  const content = stripNonValuable(markdown);
  const system = `You are a data formatter. Extract a compact, structured report from the scraped markdown for groundwater assessments.
- Capture (if present): Area of Focus, Year.
- Include top 3-8 key metrics as label/value(/unit).
- Include 1-3 concise tables (e.g., Recharge breakdown, Discharges, District/Taluk summary). Keep columns <= 4.
- Do not invent values. Omit boilerplate and images. Return ONLY JSON per schema.`;

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    system,
    prompt: content,
    schema: ReportSchema,
  });

  return object as z.infer<typeof ReportSchema>;
}


