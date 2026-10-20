// src/lib/data.ts
// Chargement et parsing de tous les fichiers data/processed/
import Papa from 'papaparse'
import {
  SectorsGeoJsonSchema, ResultsJsonSchema, SensitivityJsonSchema,
  type SectorsGeoJson, type RainRecord, type NdviRecord,
  type NdviRefRecord, type SectorResult, type SensitivityJson,
  RainRecordSchema, NdviRecordSchema, NdviRefRecordSchema,
} from './schemas'

const BASE = import.meta.env.BASE_URL

async function fetchJSON(path: string) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`Fichier manquant : ${path}`)
  return res.json()
}

async function fetchCSV<T>(path: string): Promise<T[]> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`Fichier manquant : ${path}`)
  const text = await res.text()
  const result = Papa.parse<T>(text, { header: true, dynamicTyping: true, skipEmptyLines: true })
  return result.data
}

export async function loadSectors(): Promise<SectorsGeoJson> {
  const raw = await fetchJSON('data/processed/sectors.geojson')
  return SectorsGeoJsonSchema.parse(raw)
}

export async function loadResults(): Promise<SectorResult[]> {
  const raw = await fetchJSON('data/processed/results.json')
  const parsed = ResultsJsonSchema.parse(raw)
  return parsed.sectors
}

export async function loadRainDaily(): Promise<RainRecord[]> {
  const rows = await fetchCSV<Record<string, unknown>>('data/processed/rain_daily.csv')
  return rows.map(r => RainRecordSchema.parse(r))
}

export async function loadNdviSeries(): Promise<NdviRecord[]> {
  const rows = await fetchCSV<Record<string, unknown>>('data/processed/ndvi_series.csv')
  return rows.map(r => NdviRecordSchema.parse({
    ...r,
    ndvi_median: r.ndvi_median === '' ? null : r.ndvi_median,
    ndvi_p25: r.ndvi_p25 === '' ? null : r.ndvi_p25,
    ndvi_p75: r.ndvi_p75 === '' ? null : r.ndvi_p75,
  }))
}

export async function loadNdviReference(): Promise<NdviRefRecord[]> {
  const rows = await fetchCSV<Record<string, unknown>>('data/processed/ndvi_reference.csv')
  return rows.map(r => NdviRefRecordSchema.parse(r))
}

export async function loadSensitivity(): Promise<SensitivityJson> {
  const raw = await fetchJSON('data/processed/sensitivity.json')
  return SensitivityJsonSchema.parse(raw)
}

export async function loadMetadata(): Promise<Record<string, unknown>> {
  return fetchJSON('data/processed/metadata.json')
}
