import { z } from "zod";

export type LocationType = "STATE" | "DISTRICT" | "BLOCK";

export const LocationUUIDsSchema = z.object({
  locuuid: z.string().uuid(),
  stateuuid: z.string().uuid(),
});

export const QueryParamsSchema = z.object({
  locationName: z.string().min(2),
  locationType: z.enum(["STATE", "DISTRICT", "BLOCK"]),
  year: z.string().optional(),
  computationType: z.string().optional(),
  component: z.string().optional(),
  period: z.string().optional(),
  category: z.string().optional(),
});

export type LocationUUIDs = z.infer<typeof LocationUUIDsSchema>;
export type QueryParams = z.infer<typeof QueryParamsSchema>;

export interface GroundwaterAssessment {
  locationName: string;
  locationType: LocationType;
  year: string;
  metrics: Record<string, string | number>;
  sourceUrl: string;
  rawHtml?: string;
  rawMarkdown?: string;
}


