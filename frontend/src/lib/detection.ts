// src/lib/detection.ts
/**
 * Implémentation TypeScript de l'algorithme de détection SemisSûr.
 * Doit produire des résultats identiques au code Python dans pipeline/detect_core.py.
 * Utilisée pour le recalcul interactif de sensibilité dans le navigateur.
 */

export interface RainCfg {
  start_search_day: string   // "06-01"
  accum_days: number         // 3
  trigger_accum_mm: number   // 20
  dry_spell_window_days: number  // 30
  dry_day_max_rain_mm: number    // 1.0
  dry_spell_min_duration_days: number  // 8
}

export interface NdviCfg {
  peak_window_days: number   // 25
  trough_window_days: number // 30
  relative_drop_min: number  // 0.15
  recovery_abs_min: number   // 0.05
  recovery_window_days: number // 40
}

export interface SeasonStart {
  date: string
  cumul_mm: number
}

export interface DrySpell {
  max_dry_days: number
  dry_start: string | null
  dry_end: string | null
  is_critical: boolean
}

export interface NdviSignature {
  has_signature: boolean
  peak_value?: number
  peak_date?: string
  trough_value?: number
  trough_date?: string
  relative_drop?: number
  recovery_value?: number
  recovery_date?: string
  recovery_delta?: number
  error?: string
}

export function detectSeasonStart(
  rainSeries: number[],
  dates: string[],
  cfg: RainCfg
): SeasonStart | null {
  const searchStartMD = cfg.start_search_day
  const accumDays = cfg.accum_days
  const triggerMm = cfg.trigger_accum_mm

  for (let i = 0; i < dates.length; i++) {
    const dateMD = dates[i].substring(5) // MM-DD
    if (dateMD < searchStartMD) continue
    if (i + accumDays > rainSeries.length) break
    const windowSum = rainSeries.slice(i, i + accumDays).reduce((a, b) => a + b, 0)
    if (windowSum >= triggerMm) {
      return { date: dates[i], cumul_mm: Math.round(windowSum * 10) / 10 }
    }
  }
  return null
}

export function detectDrySpell(
  rainSeries: number[],
  dates: string[],
  startDate: string,
  cfg: RainCfg
): DrySpell {
  const windowDays = cfg.dry_spell_window_days
  const maxRain = cfg.dry_day_max_rain_mm
  const minDur = cfg.dry_spell_min_duration_days

  const startIdx = dates.indexOf(startDate)
  if (startIdx < 0) return { max_dry_days: 0, dry_start: null, dry_end: null, is_critical: false }

  const searchEnd = Math.min(startIdx + windowDays + 1, dates.length)
  const windowRain = rainSeries.slice(startIdx, searchEnd)
  const windowDates = dates.slice(startIdx, searchEnd)

  let maxRun = 0
  let curRun = 0
  let curStart: string | null = null
  let bestStart: string | null = null
  let bestEnd: string | null = null

  for (let j = 0; j < windowRain.length; j++) {
    if (windowRain[j] < maxRain) {
      if (curRun === 0) curStart = windowDates[j]
      curRun++
      if (curRun > maxRun) {
        maxRun = curRun
        bestStart = curStart
        bestEnd = windowDates[j]
      }
    } else {
      curRun = 0
    }
  }

  return {
    max_dry_days: maxRun,
    dry_start: bestStart,
    dry_end: bestEnd,
    is_critical: maxRun >= minDur,
  }
}

export function detectNdviSignature(
  ndviDates: string[],
  ndviMedians: (number | null)[],
  seasonStartDate: string | null,
  cfg: NdviCfg
): NdviSignature {
  if (!seasonStartDate) return { has_signature: false, error: 'Pas de début de saison' }

  const startMs = new Date(seasonStartDate).getTime()
  const valid: [number, number][] = ndviDates
    .map((d, i) => [new Date(d).getTime(), ndviMedians[i] as number] as [number, number])
    .filter(([, v]) => v !== null && !isNaN(v))

  if (valid.length === 0) return { has_signature: false, error: 'Aucune observation valide' }

  // PIC dans les peak_window jours après le début de saison
  let peakVal: number | null = null
  let peakMs: number | null = null
  for (const [ms, v] of valid) {
    const diff = (ms - startMs) / 86400000
    if (diff >= 0 && diff <= cfg.peak_window_days) {
      if (peakVal === null || v > peakVal) { peakVal = v; peakMs = ms }
    }
  }
  if (peakVal === null || peakMs === null) return { has_signature: false, error: 'Aucun pic dans la fenêtre' }

  // CREUX dans les trough_window jours après le pic
  let troughVal: number | null = null
  let troughMs: number | null = null
  for (const [ms, v] of valid) {
    const diff = (ms - peakMs) / 86400000
    if (diff >= 1 && diff <= cfg.trough_window_days) {
      if (troughVal === null || v < troughVal) { troughVal = v; troughMs = ms }
    }
  }
  if (troughVal === null || troughMs === null) return { has_signature: false, error: 'Aucun creux après le pic' }

  const relativeDrop = peakVal > 0 ? (peakVal - troughVal) / peakVal : 0
  const msToDateStr = (ms: number) => new Date(ms).toISOString().split('T')[0]

  if (relativeDrop < cfg.relative_drop_min) {
    return {
      has_signature: false,
      peak_value: Math.round(peakVal * 10000) / 10000,
      peak_date: msToDateStr(peakMs),
      trough_value: Math.round(troughVal * 10000) / 10000,
      trough_date: msToDateStr(troughMs),
      relative_drop: Math.round(relativeDrop * 10000) / 10000,
    }
  }

  // REMONTÉE dans les recovery_window jours après le creux
  let recoveryVal: number | null = null
  let recoveryMs: number | null = null
  for (const [ms, v] of valid) {
    const diff = (ms - troughMs) / 86400000
    if (diff >= 1 && diff <= cfg.recovery_window_days) {
      if (recoveryVal === null || v > recoveryVal) { recoveryVal = v; recoveryMs = ms }
    }
  }

  const recoveryDelta = recoveryVal !== null ? recoveryVal - troughVal : 0

  return {
    has_signature: true,
    peak_value: Math.round(peakVal * 10000) / 10000,
    peak_date: msToDateStr(peakMs),
    trough_value: Math.round(troughVal * 10000) / 10000,
    trough_date: msToDateStr(troughMs),
    relative_drop: Math.round(relativeDrop * 10000) / 10000,
    recovery_value: recoveryVal !== null ? Math.round(recoveryVal * 10000) / 10000 : undefined,
    recovery_date: recoveryMs !== null ? msToDateStr(recoveryMs) : undefined,
    recovery_delta: Math.round(recoveryDelta * 10000) / 10000,
  }
}
