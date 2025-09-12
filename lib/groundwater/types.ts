import { z } from "zod";

// Core enums and literals
export const AdministrativeLevelSchema = z.enum([
  "national",
  "state",
  "district",
  "block",
]);
export type AdministrativeLevel = z.infer<typeof AdministrativeLevelSchema>;

export const ExtractionCategorySchema = z.enum([
  "Safe",
  "Semi-Critical",
  "Critical",
  "Over-Exploited",
]);
export type ExtractionCategory = z.infer<typeof ExtractionCategorySchema>;

// Shared basic schemas
export const GeoLocationSchema = z.object({
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
});
export type GeoLocation = z.infer<typeof GeoLocationSchema>;

export const RegionIdentifierSchema = z.object({
  level: AdministrativeLevelSchema,
  id: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
});
export type RegionIdentifier = z.infer<typeof RegionIdentifierSchema>;

// 1) GroundwaterAssessment
export const GroundwaterAssessmentSchema = z.object({
  region: RegionIdentifierSchema.extend({
    name: z.string().min(1),
  }),
  level: AdministrativeLevelSchema,
  assessmentYear: z.number().int().min(1900).max(3000),
  geo: GeoLocationSchema.optional(),
  metrics: z.object({
    annualRechargeBcm: z.number().nonnegative(),
    extractableResourcesBcm: z.number().nonnegative(),
    totalExtractionBcm: z.number().nonnegative(),
    stageOfExtractionPercent: z.number().min(0),
    category: ExtractionCategorySchema,
  }),
  usageBreakdown: z
    .object({
      irrigationBcm: z.number().nonnegative().optional(),
      domesticBcm: z.number().nonnegative().optional(),
      industrialBcm: z.number().nonnegative().optional(),
    })
    .optional(),
  notes: z.string().optional(),
  source: z
    .object({
      system: z.literal("INGRES"),
      url: z.string().url().optional(),
      retrievedAt: z.string().datetime().optional(),
    })
    .optional(),
});
export type GroundwaterAssessment = z.infer<typeof GroundwaterAssessmentSchema>;

// 2) TrendAnalysis
export const TrendPointSchema = z.object({
  year: z.number().int(),
  stageOfExtractionPercent: z.number().min(0),
  annualRechargeBcm: z.number().nonnegative().optional(),
  totalExtractionBcm: z.number().nonnegative().optional(),
});
export type TrendPoint = z.infer<typeof TrendPointSchema>;

export const ProjectionPointSchema = z.object({
  year: z.number().int(),
  projectedStageOfExtractionPercent: z.number().min(0),
  lowerCI: z.number().min(0).optional(),
  upperCI: z.number().min(0).optional(),
});
export type ProjectionPoint = z.infer<typeof ProjectionPointSchema>;

export const TrendAnalysisSchema = z.object({
  region: RegionIdentifierSchema,
  level: AdministrativeLevelSchema,
  history: z.array(TrendPointSchema),
  projections: z.array(ProjectionPointSchema).optional(),
  method: z
    .object({
      technique: z.enum(["naive", "moving-average", "linear-regression", "arima"]).default("naive"),
      generatedAt: z.string().datetime().optional(),
    })
    .optional(),
});
export type TrendAnalysis = z.infer<typeof TrendAnalysisSchema>;

// 3) RegionalComparison
export const RegionMetricSchema = z.object({
  region: RegionIdentifierSchema,
  level: AdministrativeLevelSchema,
  assessmentYear: z.number().int(),
  category: ExtractionCategorySchema,
  stageOfExtractionPercent: z.number().min(0),
  annualRechargeBcm: z.number().nonnegative().optional(),
  totalExtractionBcm: z.number().nonnegative().optional(),
});
export type RegionMetric = z.infer<typeof RegionMetricSchema>;

export const RegionalComparisonSchema = z.object({
  comparedAt: z.string().datetime().optional(),
  metrics: z.array(RegionMetricSchema),
  insights: z.array(z.string()).optional(),
});
export type RegionalComparison = z.infer<typeof RegionalComparisonSchema>;

// Utility: API response wrappers
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({ success: z.literal(true), data: dataSchema });
export const ApiErrorSchema = z.object({ success: z.literal(false), error: z.string() });

export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = { success: false; error: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;


