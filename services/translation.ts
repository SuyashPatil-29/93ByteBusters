export type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'kn' | 'mr' | 'gu' | 'pa';

export function detectLanguageHint(text: string): LanguageCode {
  // Minimal heuristic; default to English
  return 'en';
}

export async function translateText(text: string, target: LanguageCode): Promise<string> {
  // Placeholder: integrate a real translation API later
  return text;
}


