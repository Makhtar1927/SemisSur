// src/lib/schemas.ts
// Validation des fichiers data/processed/ avec Zod
import { z } from 'zod'

export const SectorSchema = z.object({
  id: z.string(),
  nom: z.string(),
  commune: z.string(),
  crop_frac: z.number().min(0).max(1),
  area_km2: z.number().positive(),
  center_lon: z.number(),
  center_lat: z.number(),
})

export const GeoJsonFeatureSchema = z.object({
  type: z.literal('Feature'),
  id: z.string(),
  geometry: z.object({ type: z.string(), coordinates: z.array(z.unknown()) }),
  properties: SectorSchema,
})

export const SectorsGeoJsonSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(GeoJsonFeatureSchema),
})

export const RainRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sector_id: z.string(),
  rain_mm: z.number().min(0),
})

export const NdviRecordSchema = z.object({
  date_start: z.string(),
  date_end: z.string(),
  sector_id: z.string(),
  ndvi_median: z.union([z.number(), z.null()]),
  ndvi_p25: z.union([z.number(), z.null()]),
  ndvi_p75: z.union([z.number(), z.null()]),
  n_valid_px: z.number().int().min(0),
  cloud_frac: z.number().min(0).max(1),
})

export const NdviRefRecordSchema = z.object({
  window: z.string(),
  sector_id: z.string(),
  ndvi_p10: z.number(),
  ndvi_p50: z.number(),
  ndvi_p90: z.number(),
  n_years: z.number().int(),
})

export const SectorResultSchema = z.object({
  sector_id: z.string(),
  nom: z.string(),
  commune: z.string(),
  crop_frac: z.number(),
  season_start_date: z.union([z.string(), z.null()]),
  season_trigger_mm: z.union([z.number(), z.null()]),
  max_dry_days: z.number().int().min(0),
  dry_start: z.union([z.string(), z.null()]),
  dry_end: z.union([z.string(), z.null()]),
  dry_is_critical: z.boolean(),
  ndvi_peak_value: z.union([z.number(), z.null()]),
  ndvi_peak_date: z.union([z.string(), z.null()]),
  ndvi_trough_value: z.union([z.number(), z.null()]),
  ndvi_trough_date: z.union([z.string(), z.null()]),
  ndvi_relative_drop: z.union([z.number(), z.null()]),
  ndvi_recovery_value: z.union([z.number(), z.null()]),
  ndvi_recovery_date: z.union([z.string(), z.null()]),
  ndvi_recovery_delta: z.union([z.number(), z.null()]),
  ndvi_anomaly_min: z.union([z.number(), z.null()]),
  n_valid_obs: z.number().int().min(0),
  avg_cloud_frac: z.number().min(0).max(1),
  statut: z.enum(['signature_probable', 'baisse_a_examiner', 'pas_de_signature', 'non_evalue']),
  confidence: z.enum(['eleve', 'moyen', 'faible']),
})

export const ResultsJsonSchema = z.object({
  sectors: z.array(SectorResultSchema),
  generated_at: z.string(),
})

export const SensitivityEntrySchema = z.object({
  rain_trigger_mm: z.number(),
  dry_spell_days: z.number().int(),
  ndvi_drop_min: z.number(),
  n_sectors_signaled: z.number().int(),
  pct_sectors_signaled: z.number(),
})

export const SensitivityJsonSchema = z.object({
  grid: z.array(SensitivityEntrySchema),
  n_sectors_total: z.number().int(),
  generated_at: z.string(),
})

export type Sector = z.infer<typeof SectorSchema>
export type GeoJsonFeature = z.infer<typeof GeoJsonFeatureSchema>
export type SectorsGeoJson = z.infer<typeof SectorsGeoJsonSchema>
export type RainRecord = z.infer<typeof RainRecordSchema>
export type NdviRecord = z.infer<typeof NdviRecordSchema>
export type NdviRefRecord = z.infer<typeof NdviRefRecordSchema>
export type SectorResult = z.infer<typeof SectorResultSchema>
export type ResultsJson = z.infer<typeof ResultsJsonSchema>
export type SensitivityEntry = z.infer<typeof SensitivityEntrySchema>
export type SensitivityJson = z.infer<typeof SensitivityJsonSchema>
