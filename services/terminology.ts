export interface TermEntry {
  key: string;
  preferred: string;
  variants: string[];
}

const baseTerms: TermEntry[] = [
  { key: 'recharge', preferred: 'Recharge', variants: ['recharge', 'groundwater recharge'] },
  { key: 'extraction', preferred: 'Extraction', variants: ['extraction', 'withdrawal'] },
];

export function normalizeTerm(input: string): string {
  const t = input.toLowerCase().trim();
  for (const entry of baseTerms) {
    if (entry.variants.some(v => v.toLowerCase() === t)) return entry.preferred;
  }
  return input;
}


