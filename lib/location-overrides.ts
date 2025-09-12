import type { LocationType } from '@/lib/groundwater';

export interface OverrideEntry {
  name: string;
  type: LocationType;
  locuuid: string;
  stateuuid: string;
}

function normalize(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Built-in minimal overrides for quick demo. Extend via env variable.
const builtin: OverrideEntry[] = [
  {
    name: 'bengaluru (urban)',
    type: 'DISTRICT',
    locuuid: 'fc194628-dfa2-4026-b410-5535a5ceea8c',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'karnataka',
    type: 'STATE',
    locuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'thane',
    type: 'DISTRICT',
    locuuid: '5f3f8ec1-7db5-4db7-8235-33320ed4bbbd',
    stateuuid: 'e7b3f02d-2497-4bcd-9e20-baa4b621822b',
  },
];

function parseEnvOverrides(): OverrideEntry[] {
  const raw = process.env.INGRES_LOCATION_OVERRIDES;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((e) => e && e.name && e.type && e.locuuid && e.stateuuid);
    }
    return [];
  } catch {
    return [];
  }
}

const envOverrides = parseEnvOverrides();

export function getOverrideUUIDs(name: string, type: LocationType) {
  const n = normalize(name);
  const all = envOverrides.concat(builtin);
  const hit = all.find((e) => normalize(e.name) === n && e.type === type);
  if (!hit) return null;
  return { locuuid: hit.locuuid, stateuuid: hit.stateuuid };
}


