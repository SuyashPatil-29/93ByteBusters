// @ts-nocheck
import { Message, TextStreamMessage } from "@/components/message";
import { openai } from "@ai-sdk/openai";
import { CoreMessage, generateId, generateText } from "ai";
import { getJson } from "serpapi";
import { createAI, createStreamableValue, getMutableAIState, streamUI } from "ai/rsc";
import { ReactNode } from "react";
import { z } from "zod";

import { getGroundwaterStatus as getStatus, NaturalQuerySchema, queryINGRES as queryIngres } from "@/services/ingres-api";
import type { GroundwaterAssessment } from "@/lib/groundwater";
import { GroundwaterStatus } from "@/components/GroundwaterStatus";
import { TrendAnalysisChart } from "@/components/TrendAnalysisChart";
import { RegionalComparisonDashboard } from "@/components/RegionalComparisonDashboard";
import { Markdown } from "@/components/markdown";
import { MarkdownTableView } from "@/components/MarkdownTableView";
 

const sendMessage = async (message: string) => {
  "use server";

  const messages = getMutableAIState<typeof AI>("messages");

  messages.update([
    ...(messages.get() as CoreMessage[]),
    { role: "user", content: message },
  ]);

  const contentStream = createStreamableValue("");
  const textComponent = <TextStreamMessage content={contentStream.value} />;

  const { value: stream } = await streamUI({
    model: openai("gpt-4o"),
    system: `\
    You are an INGRES Groundwater assistant for India.\n
    - Resolve locations to UUIDs and fetch INGRES groundwater assessments.\n
    - Prefer precise, sourced answers with the source URL.\n
    - Use getGroundwaterStatus for location questions (state/district/block).\n
    - Use queryINGRES for advanced parameterized queries.\n
    - Use searchGroundwaterResearch to find relevant research and CGWB docs.\n
    - When given Firecrawl markdown, use renderFirecrawlMarkdown to extract non-image content into tables and keep image accordions.\n
    - Be concise and domain-accurate.`,
    messages: messages.get() as CoreMessage[],
    text: async function* ({ content, done }) {
      if (done) {
        messages.done([
          ...(messages.get() as CoreMessage[]),
          { role: "assistant", content },
        ]);

        contentStream.done();
      } else {
        contentStream.update(content);
      }

      return textComponent;
    },
    tools: {
      renderFirecrawlMarkdown: {
        description: "Parse Firecrawl markdown: drop images, table all other content. Also send extracted text to the model.",
        parameters: z.object({ markdown: z.string() }),
        generate: async function* ({ markdown }) {
          const toolCallId = generateId();
          const stripImages = (md: string): { nonImageMd: string; imagesMd: string } => {
            // Collect images to a separate buffer while removing from text
            const imageRegex = /!\[[^\]]*\]\([^\)]+\)/g;
            const images = md.match(imageRegex)?.join("\n\n") ?? "";
            const nonImages = md.replace(imageRegex, "");
            return { nonImageMd: nonImages, imagesMd: images };
          };

          type Section = { title?: string; caption?: string; columns: string[]; rows: string[][] };

          const parseToSections = (md: string): { sections: Section[]; plainText: string } => {
            const lines = md.split(/\r?\n/).map(l => l.trim());
            const sections: Section[] = [];
            const keyValues: string[][] = [];
            const headings: string[] = [];
            const listItems: string[][] = [];
            const otherLines: string[] = [];
            const tables: Section[] = [];

            let i = 0;
            let pendingTitle: string | null = null;

            const pushTable = (header: string[], rows: string[][], caption?: string) => {
              tables.push({ title: undefined, caption, columns: header, rows });
            };

            while (i < lines.length) {
              let line = lines[i];
              if (!line) { i++; continue; }

              // Markdown tables starting with |
              if (line.startsWith('|')) {
                const tableLines: string[] = [];
                while (i < lines.length && lines[i].startsWith('|')) {
                  tableLines.push(lines[i]);
                  i++;
                }
                // Parse table
                const parseRow = (s: string) => s.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
                const header = parseRow(tableLines[0]);
                // Skip alignment row if present (---)
                let dataStart = 1;
                if (tableLines[1] && /:-{2,}|-{3,}:?|\|/.test(tableLines[1])) {
                  dataStart = 2;
                }
                const rows = tableLines.slice(dataStart).map(parseRow);
                pushTable(header, rows);
                pendingTitle = null;
                continue;
              }

              // Headings
              if (/^#{1,6}\s+/.test(line)) {
                const text = line.replace(/^#{1,6}\s+/, '').trim();
                // If pending title exists and this heading is numeric, pair it
                if (pendingTitle && /^[-+]?\d[\d,]*(?:\.\d+)?$/.test(text.replace(/,/g, ''))) {
                  keyValues.push([pendingTitle, text]);
                  pendingTitle = null;
                } else {
                  headings.push(text);
                  pendingTitle = text; // may be followed by a numeric value line
                }
                i++;
                continue;
              }

              // Lists
              if (/^(?:[-*+]\s+|\d+\.\s+)/.test(line)) {
                const item = line.replace(/^\d+\.\s+/, '').replace(/^[-*+]\s+/, '').trim();
                listItems.push([item]);
                pendingTitle = null;
                i++;
                continue;
              }

              // Key: Value lines
              if (/:/.test(line) && !/^https?:\/\//i.test(line)) {
                const idx = line.indexOf(':');
                const key = line.slice(0, idx).trim().replace(/\s{2,}/g, ' ');
                const val = line.slice(idx + 1).trim();
                keyValues.push([key, val]);
                pendingTitle = null;
                i++;
                continue;
              }

              // Standalone numeric line following a title
              if (pendingTitle && /^[-+]?\d[\d,]*(?:\.\d+)?$/.test(line.replace(/,/g, ''))) {
                keyValues.push([pendingTitle, line]);
                pendingTitle = null;
                i++;
                continue;
              }

              // Fallback content line
              otherLines.push(line);
              pendingTitle = null;
              i++;
            }

            const sectionsOut: Section[] = [];
            if (keyValues.length > 0) sectionsOut.push({ title: 'Key Values', columns: ['Key', 'Value'], rows: keyValues });
            if (headings.length > 0) sectionsOut.push({ title: 'Headings', columns: ['Heading'], rows: headings.map(h => [h]) });
            if (listItems.length > 0) sectionsOut.push({ title: 'List Items', columns: ['Item'], rows: listItems });
            sectionsOut.push(...tables.map((t, idx) => ({ ...t, title: t.title ?? `Table ${idx + 1}` })));
            if (otherLines.length > 0) sectionsOut.push({ title: 'Other Content', columns: ['Text'], rows: otherLines.map(t => [t]) });

            const plainText = [
              ...keyValues.map(([k, v]) => `${k}: ${v}`),
              ...headings,
              ...listItems.map(([i]) => i),
              ...tables.flatMap(t => [t.columns.join(', '), ...t.rows.map(r => r.join(', '))]),
              ...otherLines,
            ].join('\n');

            return { sections: sectionsOut, plainText };
          };

          yield (
            <Message role="assistant" content={<div className="text-sm text-zinc-600">Parsing Firecrawl markdown…</div>} />
          );
          try {
            const { nonImageMd, imagesMd } = stripImages(markdown);
            const { sections, plainText } = parseToSections(nonImageMd);

            // Send extracted text to the model (no need to display full response)
            const ai = await generateText({
              model: openai("gpt-4o-mini"),
              system: 'You are a groundwater data assistant. You will receive raw extracted assessment text. Validate consistency and be ready to answer follow-ups.',
              prompt: plainText.slice(0, 120000),
            });

            messages.done([
              ...(messages.get() as CoreMessage[]),
              { role: "assistant", content: [{ type: "tool-call", toolCallId, toolName: "renderFirecrawlMarkdown", args: { markdown } }] },
              { role: "tool", content: [{ type: "tool-result", toolName: "renderFirecrawlMarkdown", toolCallId, result: { ok: true, sentChars: plainText.length, modelTokenEstimate: ai.usage?.totalTokens ?? null } }] },
            ]);

            return (
              <Message
                role="assistant"
                content={
                  <div className="space-y-6">
                    <MarkdownTableView sections={sections} />
                    {imagesMd.trim().length > 0 ? (
                      <div>
                        <div className="text-sm font-medium text-zinc-700 mb-2">Images</div>
                        <Markdown>{imagesMd}</Markdown>
                      </div>
                    ) : null}
                  </div>
                }
              />
            );
          } catch (e: any) {
            return <Message role="assistant" content={<div className="text-sm">Failed to parse markdown.</div>} />;
          }
        },
      },
      getGroundwaterStatus: {
        description: "Fetch INGRES groundwater status for a location.",
        parameters: NaturalQuerySchema,
        generate: async function* ({ locationQuery, year, component }) {
          const toolCallId = generateId();
          yield (
            <Message role="assistant" content={<div className="text-sm text-zinc-600">Fetching groundwater status for {locationQuery}...</div>} />
          );
          try {
            const assessment: GroundwaterAssessment = await getStatus({ locationQuery, year, component });
            // Send extracted non-image text to the model for context
            try {
              const md = (assessment.rawMarkdown || '').replace(/!\[[^\]]*\]\([^\)]+\)/g, '');
              if (md && md.trim().length > 0) {
                await generateText({
                  model: openai("gpt-4o-mini"),
                  system: 'You are a groundwater data assistant. You will receive raw extracted assessment text. Validate consistency and be ready to answer follow-ups.',
                  prompt: md.slice(0, 120000),
                });
              }
            } catch {}
            messages.done([
              ...(messages.get() as CoreMessage[]),
              { role: "assistant", content: [{ type: "tool-call", toolCallId, toolName: "getGroundwaterStatus", args: { locationQuery, year, component } }] },
              { role: "tool", content: [{ type: "tool-result", toolName: "getGroundwaterStatus", toolCallId, result: assessment }] },
            ]);
            return (
              <Message role="assistant" content={<GroundwaterStatus data={assessment} />} />
            );
          } catch (e: any) {
            return <Message role="assistant" content={<div className="text-sm">Sorry, I couldn&apos;t fetch data right now.</div>} />;
          }
        },
      },
      queryINGRES: {
        description: "Run an advanced INGRES query using UUID-resolved parameters.",
        parameters: z.object({
          locationName: z.string(),
          locationType: z.enum(["STATE","DISTRICT","BLOCK"]),
          year: z.string().optional(),
          computationType: z.string().optional(),
          component: z.string().optional(),
          period: z.string().optional(),
          category: z.string().optional(),
        }),
        generate: async function* (args) {
          const toolCallId = generateId();
          yield (<Message role="assistant" content={<div className="text-sm text-zinc-600">Querying INGRES…</div>} />);
          try {
            const result = await queryIngres(args);
            messages.done([
              ...(messages.get() as CoreMessage[]),
              { role: "assistant", content: [{ type: "tool-call", toolCallId, toolName: "queryINGRES", args }] },
              { role: "tool", content: [{ type: "tool-result", toolName: "queryINGRES", toolCallId, result }] },
            ]);
            return (<Message role="assistant" content={<div className="text-sm">Fetched data from <a className="text-blue-600" href={result.url} target="_blank" rel="noreferrer">INGRES</a>. I can analyze or visualize this further if you specify a metric or category.</div>} />);
          } catch (e: any) {
            return <Message role="assistant" content={<div className="text-sm">Query failed.</div>} />;
          }
        }
      },
      searchGroundwaterResearch: {
        description: "Search for groundwater research and official CGWB/INGRES docs.",
        parameters: z.object({ query: z.string() }),
        generate: async function* ({ query }) {
          const toolCallId = generateId();
          const q = `${query} groundwater assessment India CGWB site:.gov.in`;
          yield (<Message role="assistant" content={<div className="text-sm">Searching research: {q}</div>} />);
          try {
            const resp = await getJson({ api_key: process.env.SERPAPI_KEY, engine: "google", q, num: 8 });
            messages.done([
              ...(messages.get() as CoreMessage[]),
              { role: "assistant", content: [{ type: "tool-call", toolCallId, toolName: "searchGroundwaterResearch", args: { query } }] },
              { role: "tool", content: [{ type: "tool-result", toolName: "searchGroundwaterResearch", toolCallId, result: resp }] },
            ]);
            return (<Message role="assistant" content={<div className="space-y-2">{resp.organic_results?.slice(0,6).map((r:any)=>(<div key={r.link} className="border rounded p-3"><a className="text-blue-700" href={r.link} target="_blank" rel="noreferrer">{r.title}</a><div className="text-xs text-zinc-500">{r.displayed_link}</div><div className="text-sm">{r.snippet}</div></div>))}</div>} />);
          } catch (e: any) {
            return <Message role="assistant" content={`Search failed: ${e.message}`} />;
          }
        }
      },
      generateTrendAnalysis: {
        description: "Generate simple trend analysis by fetching multiple years for a location.",
        parameters: z.object({
          locationQuery: z.string(),
          years: z.array(z.string()).min(2)
        }),
        generate: async function* ({ locationQuery, years }) {
          const toolCallId = generateId();
          yield (<Message role="assistant" content={<div className="text-sm">Generating trend analysis for {locationQuery}…</div>} />);
          try {
            const assessments = await Promise.all(
              years.map((y: string) => getStatus({ locationQuery, year: y }))
            );
            const rows: Array<{ year: string; value: number }> = assessments.map((assessment, idx) => {
              const firstMetric = Object.values(assessment.metrics)[0];
              const value = typeof firstMetric === 'number' ? firstMetric : parseFloat(String(firstMetric).replace(/[^0-9.]/g, ''));
              return { year: years[idx], value: isNaN(value) ? 0 : value };
            });
            messages.done([
              ...(messages.get() as CoreMessage[]),
              { role: "assistant", content: [{ type: "tool-call", toolCallId, toolName: "generateTrendAnalysis", args: { locationQuery, years } }] },
              { role: "tool", content: [{ type: "tool-result", toolName: "generateTrendAnalysis", toolCallId, result: rows }] },
            ]);
            return (
              <Message role="assistant" content={<TrendAnalysisChart series={rows.map(r=> ({ date: r.year, value: r.value }))} />} />
            );
          } catch (e: any) {
            return <Message role="assistant" content={`Trend analysis failed: ${e.message}`} />;
          }
        }
      },
      compareRegions: {
        description: "Compare two regions by a selected year and first metric.",
        parameters: z.object({
          a: z.string(),
          b: z.string(),
          year: z.string().default('2024-2025')
        }),
        generate: async function* ({ a, b, year }) {
          const toolCallId = generateId();
          yield (<Message role="assistant" content={<div className="text-sm">Comparing {a} vs {b}…</div>} />);
          try {
            const [aa, bb] = await Promise.all([
              getStatus({ locationQuery: a, year }),
              getStatus({ locationQuery: b, year }),
            ]);
            const metricName = Object.keys(aa.metrics)[0] ?? 'metric';
            const av = aa.metrics[metricName];
            const bv = bb.metrics[metricName];
            messages.done([
              ...(messages.get() as CoreMessage[]),
              { role: "assistant", content: [{ type: "tool-call", toolCallId, toolName: "compareRegions", args: { a, b, year } }] },
              { role: "tool", content: [{ type: "tool-result", toolName: "compareRegions", toolCallId, result: { metricName, a: { name: aa.locationName, value: av }, b: { name: bb.locationName, value: bv } } }] },
            ]);
            return (
              <Message role="assistant" content={<RegionalComparisonDashboard a={{ name: aa.locationName, value: av }} b={{ name: bb.locationName, value: bv }} metricName={metricName} />} />
            );
          } catch (e: any) {
            return <Message role="assistant" content={`Comparison failed: ${e.message}`} />;
          }
        }
      }
    },
  });

  return stream;
};

export type UIState = Array<ReactNode>;

export type AIState = {
  chatId: string;
  messages: Array<CoreMessage>;
};

export const AI = createAI<AIState, UIState>({
  initialAIState: {
    chatId: generateId(),
    messages: [],
  },
  initialUIState: [],
  actions: {
    sendMessage,
  },
  onSetAIState: async ({ state, done }) => {
    "use server";
    if (done) {
      // TODO: persist chat if needed
    }
  },
});


