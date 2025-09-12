import type { PrismaClient } from "@/lib/generated/prisma";
import { prisma as defaultPrisma, ensureDb } from "@/lib/prisma";
import { getFirecrawl } from "./firecrawl";
import Fuse from "fuse.js";
import { incrMetric } from "@/lib/metrics";
import { getOverrideUUIDs } from "@/lib/location-overrides";

export type LocationType = "STATE" | "DISTRICT" | "BLOCK";

export interface LocationUUIDs {
  locuuid: string;
  stateuuid: string;
}

export class INGRESLocationService {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = (prismaClient as PrismaClient) ?? (defaultPrisma as PrismaClient);
  }

  async findLocationUUIDs(locationName: string, locationType: LocationType): Promise<LocationUUIDs | null> {
    const normalizedName = locationName.trim();

    // 0) Manual overrides (env or built-in) for quick success paths
    const override = getOverrideUUIDs(normalizedName, locationType as any);
    if (override) {
      await incrMetric('uuid.override.hit');
      await this.upsertLocation(normalizedName, locationType, override);
      return override;
    }

    // 1) Try DB cache first
    const cached = await this.findFromDb(normalizedName, locationType);
    if (cached) {
      await incrMetric('uuid.cache.hit');
      return cached;
    }

    // 2) Try scraping
    const scraped = await this.scrapeLocationUUIDs(normalizedName, locationType);
    if (scraped) {
      await incrMetric('uuid.scrape.success');
      await this.upsertLocation(normalizedName, locationType, scraped);
      return scraped;
    }

    // 3) Try fuzzy match from existing DB entries
    const fuzzy = await this.fuzzyMatch(normalizedName, locationType);
    if (fuzzy) {
      await incrMetric('uuid.fuzzy.hit');
      return fuzzy;
    }

    return null;
  }

  private async findFromDb(name: string, type: LocationType): Promise<LocationUUIDs | null> {
    await ensureDb();
    const location = await this.prisma.location.findFirst({
      where: { name: name, type },
      include: { parent: true },
    });
    if (!location) return null;
    if (type === "STATE") {
      return { locuuid: location.uuid, stateuuid: location.uuid };
    }
    if (type === "DISTRICT") {
      return { locuuid: location.uuid, stateuuid: location.parent?.uuid ?? "" };
    }
    if (type === "BLOCK") {
      // parent is district, parent's parent is state
      const district = await this.prisma.location.findUnique({ where: { id: location.parentId! }, include: { parent: true } });
      return district?.parent?.uuid
        ? { locuuid: location.uuid, stateuuid: district.parent.uuid }
        : null;
    }
    return null;
  }

  private async upsertLocation(name: string, type: LocationType, uuids: LocationUUIDs): Promise<void> {
    await ensureDb();
    if (type === "STATE") {
      await this.prisma.location.upsert({
        where: { uuid: uuids.locuuid },
        create: { name, type: "STATE", uuid: uuids.locuuid },
        update: { name },
      });
      return;
    }

    if (type === "DISTRICT") {
      // ensure state exists
      const state = await this.prisma.location.upsert({
        where: { uuid: uuids.stateuuid },
        create: { name: "", type: "STATE", uuid: uuids.stateuuid },
        update: {},
      });
      await this.prisma.location.upsert({
        where: { uuid: uuids.locuuid },
        create: { name, type: "DISTRICT", uuid: uuids.locuuid, parentId: state.id },
        update: { name, parentId: state.id },
      });
      return;
    }
  }

  private async fuzzyMatch(name: string, type: LocationType): Promise<LocationUUIDs | null> {
    await ensureDb();
    const candidates = await this.prisma.location.findMany({ where: { type } });
    if (candidates.length === 0) return null;
    const fuse = new Fuse(candidates, { keys: ["name"], threshold: 0.3 });
    const match = fuse.search(name)[0]?.item;
    if (!match) return null;
    if (type === "STATE") return { locuuid: match.uuid, stateuuid: match.uuid };
    if (type === "DISTRICT") {
      const state = await this.prisma.location.findUnique({ where: { id: match.parentId! } });
      return state ? { locuuid: match.uuid, stateuuid: state.uuid } : null;
    }
    return null;
  }

  private async scrapeLocationUUIDs(name: string, type: LocationType): Promise<LocationUUIDs | null> {
    const firecrawl = getFirecrawl();
    const urls = this.generateSearchUrls(name, type);
    for (const url of urls) {
      try {
        const result = await firecrawl.scrapeUrl({ url, formats: ["html"], waitFor: 2000 } as any);
        const html = (result as any)?.html as string | undefined;
        const uuids = this.extractUUIDsFromHTML(html ?? "");
        if (uuids.locuuid && uuids.stateuuid) return uuids as LocationUUIDs;
      } catch {
        continue;
      }
    }
    return null;
  }

  private generateSearchUrls(locationName: string, locationType: LocationType): string[] {
    const encodedName = encodeURIComponent(locationName);
    const baseUrl = "https://ingres.iith.ac.in/gecdataonline/gis/INDIA";
    return [
      `${baseUrl};locname=${encodedName};loctype=${locationType}`,
      `${baseUrl}?search=${encodedName}`,
    ];
  }

  private extractUUIDsFromHTML(html: string): Partial<LocationUUIDs> {
    const uuids: Partial<LocationUUIDs> = {};
    const locuuidMatch = html.match(/locuuid[=:]([a-f0-9-]{36})/i);
    const stateuuidMatch = html.match(/stateuuid[=:]([a-f0-9-]{36})/i);
    if (locuuidMatch) uuids.locuuid = locuuidMatch[1];
    if (stateuuidMatch) uuids.stateuuid = stateuuidMatch[1];
    return uuids;
  }
}

export function generateINGRESUrl(locationUUIDs: LocationUUIDs, params: {
  locationName: string;
  locationType: LocationType;
  year?: string;
  computationType?: string;
  component?: string;
  period?: string;
  category?: string;
  mapOnClickParams?: boolean;
}): string {
  const baseUrl = "https://ingres.iith.ac.in/gecdataonline/gis/INDIA";
  const urlParams = [
    `locname=${strictEncode(params.locationName)}`,
    `loctype=${params.locationType}`,
    `view=ADMIN`,
    `locuuid=${locationUUIDs.locuuid}`,
    `year=${params.year ?? "2024-2025"}`,
    `computationType=${params.computationType ?? "normal"}`,
    params.component ? `component=${params.component}` : undefined,
    params.period ? `period=${params.period}` : undefined,
    params.category ? `category=${params.category}` : undefined,
    params.mapOnClickParams ? `mapOnClickParams=true` : undefined,
    `stateuuid=${locationUUIDs.stateuuid}`,
  ].filter(Boolean);
  return `${baseUrl};${urlParams.join(";")}`;
}

function strictEncode(input: string): string {
  return encodeURIComponent(input).replace(/\(/g, "%28").replace(/\)/g, "%29");
}


