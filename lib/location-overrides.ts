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
  // Goa State and Districts
  {
    name: 'goa',
    type: 'STATE',
    locuuid: '7f615d2f-0be6-42bf-891f-7239e101e487',
    stateuuid: '7f615d2f-0be6-42bf-891f-7239e101e487',
  },
  {
    name: 'goa north',
    type: 'DISTRICT',
    locuuid: '263270cc-5797-436b-bdd3-01db6b794e95',
    stateuuid: '7f615d2f-0be6-42bf-891f-7239e101e487',
  },
  {
    name: 'south goa',
    type: 'DISTRICT',
    locuuid: '7b17a41f-5c03-44a7-b4c4-7129aaa7a590',
    stateuuid: '7f615d2f-0be6-42bf-891f-7239e101e487',
  },

  // Karnataka State and Districts
  {
    name: 'karnataka',
    type: 'STATE',
    locuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'bagalkot',
    type: 'DISTRICT',
    locuuid: '49b27222-4a5c-4e4f-a9bd-30ac4d51a87e',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'ballari',
    type: 'DISTRICT',
    locuuid: 'b4e3ff83-c2e9-4782-9668-ad9c14d4dbe6',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'belagavi',
    type: 'DISTRICT',
    locuuid: '8bf77049-a0a8-455b-a6c0-efb7d99a9d24',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'bengaluru (rural)',
    type: 'DISTRICT',
    locuuid: '5e4381d4-773c-49b0-9283-e229a2fd50dc',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'bengaluru (urban)',
    type: 'DISTRICT',
    locuuid: 'fc194628-dfa2-4026-b410-5535a5ceea8c',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'bengaluru south',
    type: 'DISTRICT',
    locuuid: '6962b8fa-e8a2-4b37-93e0-b798f9ee7c1d',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'bidar',
    type: 'DISTRICT',
    locuuid: '516ad9f3-efaf-4910-afa0-bd93a8a28464',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'chamarajanagara',
    type: 'DISTRICT',
    locuuid: '44d9230a-8ba3-4516-98a2-df5d90cf7159',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'chikkaballapura',
    type: 'DISTRICT',
    locuuid: '20633d6d-e0fa-44f7-bfe3-94948bdcba9b',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'chikkamagaluru',
    type: 'DISTRICT',
    locuuid: '6f0ba974-468d-4c54-8550-15d9a856a3ea',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'chitradurga',
    type: 'DISTRICT',
    locuuid: '0d16d5d2-449e-4399-bdf8-df0c5b4ec0eb',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'dakshina kannada',
    type: 'DISTRICT',
    locuuid: '43aa8b45-4156-4964-b43c-269814d1dd5c',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'davanagere',
    type: 'DISTRICT',
    locuuid: 'd616e03f-2cae-4e9b-a6fe-2badc580a43b',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'dharwad',
    type: 'DISTRICT',
    locuuid: '50850ba4-e017-466b-8a9d-623510323464',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'gadag',
    type: 'DISTRICT',
    locuuid: 'e3c857a4-0f48-44e7-93fe-c3cebdbe6b55',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'hassan',
    type: 'DISTRICT',
    locuuid: '9fa87562-43a6-41a5-84c4-f5876acee609',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'haveri',
    type: 'DISTRICT',
    locuuid: 'e5e196f0-a033-4f98-9967-d87fb48affb0',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'kalburgi',
    type: 'DISTRICT',
    locuuid: '469fe3ba-dfa0-4e56-8a0b-86668ab6a753',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'kodagu',
    type: 'DISTRICT',
    locuuid: 'b2b853a3-c23e-439d-a187-304eb76388a5',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'koppal',
    type: 'DISTRICT',
    locuuid: '73536050-24e3-4bf6-933c-fb2e513a4fae',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'kolara',
    type: 'DISTRICT',
    locuuid: '35b9b1af-bd93-4002-8f7f-6a507a7ffe1a',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'mandya',
    type: 'DISTRICT',
    locuuid: '05825424-0ea1-4180-a46b-fa3f5a2757af',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'mysuru',
    type: 'DISTRICT',
    locuuid: '8caa1ea0-0f84-4652-9e97-48cc6de2b8ae',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'raichur',
    type: 'DISTRICT',
    locuuid: 'f27aad4d-bbe8-4abd-bc73-dc58f4c89238',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'shivamogga',
    type: 'DISTRICT',
    locuuid: '7275b7e2-8f12-4a17-a3d2-8190ad8e0d00',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'tumakuru',
    type: 'DISTRICT',
    locuuid: 'a6fa20e6-cf53-4598-90a8-88f5510de66a',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'udupi',
    type: 'DISTRICT',
    locuuid: '19fafdeb-e34a-4a17-9311-cccfa91cc5de',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'uttara kannada',
    type: 'DISTRICT',
    locuuid: '3b9a5a5e-88db-49fd-8812-6799699b1e57',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'vijayanagara',
    type: 'DISTRICT',
    locuuid: 'ecbae4c8-3945-49c2-8443-605071ed523f',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'vijayapura',
    type: 'DISTRICT',
    locuuid: 'fe8ad24c-bd8e-4e6e-b550-25d54ac2d25f',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
  },
  {
    name: 'yadgir',
    type: 'DISTRICT',
    locuuid: '567c60cc-3f02-4aec-b3ae-9c6efcc3f53b',
    stateuuid: 'eaec6bbb-a219-415f-bdba-991c42586352',
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


