import { groundwaterTerms } from "@/lib/groundwater/terminology";

export type LanguageCode =
  | "en" | "hi" | "te" | "ta" | "mr" | "bn" | "gu" | "kn" | "ml" | "pa" | "or" | "as";

const DEFAULT_SYSTEM =
  "You are a professional translator. Preserve domain terms and abbreviations exactly as provided in the list.";

export async function detectLanguage(text: string): Promise<LanguageCode> {
  // Simple heuristic; can be replaced with proper detection API later
  // Default to English if uncertain
  if (/[0-F]/.test(text)) return "hi" as LanguageCode; // rough Devanagari presence
  return "en";
}

export async function translateText(params: {
  text: string;
  targetLang: LanguageCode;
  preserveTerms?: string[];
}): Promise<string> {
  const { text, targetLang, preserveTerms } = params;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY env");

  const terms = Array.from(new Set([...(preserveTerms || []), ...groundwaterTerms]));

  const system = `${DEFAULT_SYSTEM}\nPreserve these terms: ${terms.join(", ")}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Translate to ${targetLang}. Text: ${text}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || text;
}


