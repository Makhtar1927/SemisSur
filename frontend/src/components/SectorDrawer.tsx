import React, { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { SectorResult, RainRecord, NdviRecord, NdviRefRecord } from '../lib/schemas'
import {
  IconClose,
  IconVolume,
  IconRain,
  IconLeaf,
  IconWarning,
  IconCheck,
  IconInfo,
} from './Icons'

interface SectorDrawerProps {
  sector: SectorResult | null
  rainData: RainRecord[]
  ndviData: NdviRecord[]
  ndviRefData: NdviRefRecord[]
  wolofMode: boolean
  onClose: () => void
}

export const SectorDrawer: React.FC<SectorDrawerProps> = ({
  sector,
  rainData,
  ndviData,
  ndviRefData,
  wolofMode,
  onClose,
}) => {
  if (!sector) return null

  // Filter rain data for this sector
  const sectorRain = useMemo(() => {
    return rainData
      .filter((r) => r.sector_id === sector.sector_id)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [rainData, sector.sector_id])

  // Filter NDVI data for this sector
  const sectorNdvi = useMemo(() => {
    return ndviData
      .filter((n) => n.sector_id === sector.sector_id)
      .sort((a, b) => a.date_start.localeCompare(b.date_start))
  }, [ndviData, sector.sector_id])

  // Filter NDVI Reference data for this sector
  const sectorRef = useMemo(() => {
    return ndviRefData
      .filter((r) => r.sector_id === sector.sector_id)
      .sort((a, b) => a.window.localeCompare(b.window))
  }, [ndviRefData, sector.sector_id])

  // Calculate cumulative rainfall
  const cumulativeRain = useMemo(() => {
    let sum = 0
    return sectorRain.map((r) => {
      sum += r.rain_mm
      return { date: r.date, daily: r.rain_mm, cum: Math.round(sum * 10) / 10 }
    })
  }, [sectorRain])

  // Rain Chart Option (ECharts)
  const rainChartOption = useMemo(() => {
    const dates = cumulativeRain.map((d) => d.date.substring(5))
    const dailyRain = cumulativeRain.map((d) => d.daily)
    const cumRain = cumulativeRain.map((d) => d.cum)

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['Pluie journalière (mm)', 'Pluie cumulée (mm)'],
        top: 0,
        textStyle: { fontSize: 11, fontFamily: 'var(--font-body)' },
      },
      grid: { left: '8%', right: '8%', bottom: '15%', top: '18%' },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { interval: 9, rotate: 30, fontSize: 10 },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Jour (mm)',
          max: 60,
          splitLine: { show: false },
        },
        {
          type: 'value',
          name: 'Cumul (mm)',
          splitLine: { lineStyle: { type: 'dashed', opacity: 0.25 } },
        },
      ],
      series: [
        {
          name: 'Pluie journalière (mm)',
          type: 'bar',
          data: dailyRain,
          itemStyle: {
            color: '#3B82F6',
            borderRadius: [2, 2, 0, 0],
          },
        },
        {
          name: 'Pluie cumulée (mm)',
          type: 'line',
          yAxisIndex: 1,
          data: cumRain,
          smooth: true,
          lineStyle: { width: 2.5, color: '#164E31' },
          markLine: sector.season_start_date
            ? {
                symbol: 'none',
                data: [
                  {
                    name: 'Seuil 20 mm',
                    yAxis: 20,
                    lineStyle: { color: '#D97706', type: 'dashed', width: 2 },
                    label: { formatter: 'Seuil Sivakumar 20mm', position: 'insideEndTop' },
                  },
                ],
              }
            : undefined,
        },
      ],
    }
  }, [cumulativeRain, sector.season_start_date])

  // NDVI Chart Option (ECharts)
  const ndviChartOption = useMemo(() => {
    const dates = sectorNdvi.map((d) => d.date_start.substring(5))
    const ndviMedians = sectorNdvi.map((d) => d.ndvi_median)
    const refP50 = sectorRef.map((r) => r.ndvi_p50)
    const refP90 = sectorRef.map((r) => r.ndvi_p90)

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['NDVI 2026', 'Référence Médiane (P50)', 'Couloir normal (P10 - P90)'],
        top: 0,
        textStyle: { fontSize: 11, fontFamily: 'var(--font-body)' },
      },
      grid: { left: '8%', right: '8%', bottom: '15%', top: '18%' },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { interval: 2, rotate: 30, fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: 'NDVI',
        min: 0.1,
        max: 0.7,
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.25 } },
      },
      series: [
        {
          name: 'NDVI 2026',
          type: 'line',
          data: ndviMedians,
          smooth: true,
          lineStyle: { width: 2.8, color: '#16A34A' },
          itemStyle: { color: '#16A34A' },
          markPoint: sector.ndvi_trough_value
            ? {
                data: [
                  {
                    name: 'Creux',
                    coord: [
                      sector.ndvi_trough_date?.substring(5),
                      sector.ndvi_trough_value,
                    ],
                    value: 'Chute',
                    itemStyle: { color: '#DC2626' },
                  },
                ],
              }
            : undefined,
        },
        {
          name: 'Référence Médiane (P50)',
          type: 'line',
          data: refP50.length ? refP50 : undefined,
          smooth: true,
          lineStyle: { width: 2, color: '#854D0E', type: 'dotted' },
        },
        {
          name: 'Couloir normal (P10 - P90)',
          type: 'line',
          data: refP90.length ? refP90 : undefined,
          lineStyle: { opacity: 0 },
          stack: 'confidence-band',
          symbol: 'none',
        },
      ],
    }
  }, [sectorNdvi, sectorRef, sector.ndvi_trough_value, sector.ndvi_trough_date])

  // Audio Speech synthesis in Wolof/French
  const handleSpeakAdvice = () => {
    if (!('speechSynthesis' in window)) return
    const textToSpeak =
      sector.statut === 'signature_probable'
        ? 'Alerte faux départ détecté. Séquence sèche prolongée de plus de huit jours après le cumul initial. Vérifiez la germination avant de ressemer.'
        : sector.statut === 'baisse_a_examiner'
        ? 'Baisse de végétation modérée observée. Surveillance conseillée sur le terrain.'
        : 'Semis optimal et bon enracinement. Conditions agro-climatiques favorables.'

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = 'fr-FR'
    utterance.rate = 0.95
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer__header">
          <div>
            <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.45rem' }}>
              <span className={`pill pill--${sector.statut === 'signature_probable' ? 'probable' : sector.statut === 'baisse_a_examiner' ? 'examine' : 'aucune'}`}>
                {sector.statut === 'signature_probable'
                  ? 'Faux départ probable'
                  : sector.statut === 'baisse_a_examiner'
                  ? 'Baisse à examiner'
                  : 'Semis normal'}
              </span>
              <span className="badge badge--real">
                Indice de confiance : {sector.confidence}
              </span>
            </div>
            <h2 className="drawer__title">{sector.nom}</h2>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--fg-muted)', marginTop: '0.35rem' }}>
              <span>Commune : <strong>{sector.commune}</strong></span>
              <span>•</span>
              <span>Part agricole : <strong>{Math.round(sector.crop_frac * 100)}%</strong></span>
            </div>
          </div>
          <button className="drawer__close" onClick={onClose} aria-label="Fermer le volet">
            <IconClose size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="drawer__body">
          {/* Diagnostic Key Numbers */}
          <div className="grid grid--3" style={{ marginBottom: '1.25rem' }}>
            <div className="stat-card" style={{ padding: '1rem' }}>
              <div className="stat-card__label">Date Semis</div>
              <div className="stat-card__value" style={{ fontSize: '1.25rem', color: 'var(--clr-vert-semis)' }}>
                {sector.season_start_date ? sector.season_start_date : 'Non détecté'}
              </div>
              <div className="stat-card__desc">
                Cumul : <strong>{sector.season_trigger_mm || 0} mm</strong>
              </div>
            </div>

            <div className="stat-card" style={{ padding: '1rem' }}>
              <div className="stat-card__label">Pause Sèche</div>
              <div className="stat-card__value" style={{ fontSize: '1.25rem', color: sector.dry_is_critical ? 'var(--clr-alerte)' : 'var(--clr-vert-semis)' }}>
                {sector.max_dry_days} j
              </div>
              <div className="stat-card__desc">
                {sector.dry_is_critical ? 'Critique (≥ 8 jours)' : 'Tolérable (< 8j)'}
              </div>
            </div>

            <div className="stat-card" style={{ padding: '1rem' }}>
              <div className="stat-card__label">Chute NDVI</div>
              <div className="stat-card__value" style={{ fontSize: '1.25rem' }}>
                {sector.ndvi_relative_drop
                  ? `-${Math.round(sector.ndvi_relative_drop * 100)}%`
                  : '0%'}
              </div>
              <div className="stat-card__desc">
                Anomalie : {sector.ndvi_anomaly_min ? sector.ndvi_anomaly_min.toFixed(2) : '0.00'}
              </div>
            </div>
          </div>

          {/* Bilingual Farmer Advice Box */}
          <div className="card" style={{ background: 'var(--bg-subtle)', borderLeft: '4px solid var(--clr-vert-semis)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <IconInfo size={16} color="var(--clr-vert-semis)" />
                <strong style={{ fontFamily: 'var(--font-title)', fontSize: '0.9rem', color: 'var(--clr-vert-semis)' }}>
                  {wolofMode ? 'Jàngat ak Digle ci Wolof' : 'Avis Agro-Météorologique'}
                </strong>
              </div>
              <button
                className="btn btn--secondary btn--sm"
                onClick={handleSpeakAdvice}
                title="Écouter le message vocal"
              >
                <IconVolume size={14} />
                <span>{wolofMode ? 'Déglul' : 'Écouter'}</span>
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--fg)' }}>
              {wolofMode ? (
                sector.statut === 'signature_probable' ? (
                  <>
                    <strong>Moytul :</strong> Taw bi tële na te am na <strong>{sector.max_dry_days} fan</strong> yu sedd gu mag (séquence sèche) ginnaaw ji bi.
                    Gàncax gi mën na lor. Xoolal ci sa tool ndax jiwu yi sax nañu baax bala nga jiwaat.
                  </>
                ) : (
                  <>
                    <strong>Koolute :</strong> Taw bi doy na ci li war (20 mm ci 3 fan). Gàncax gi ngi sàkket bu baax.
                    Amul benn ngelaw walla tàngoor bu mag bu lor suuf si.
                  </>
                )
              ) : (
                sector.statut === 'signature_probable' ? (
                  <>
                    <strong>Alerte Faux Départ :</strong> Une séquence sèche prolongée de <strong>{sector.max_dry_days} jours</strong> a suivi le déclenchement du semis du {sector.season_start_date}.
                    Risque élevé de flétrissement précoce. Il est conseillé de vérifier le taux de levée in situ.
                  </>
                ) : (
                  <>
                    <strong>Installation Favorable :</strong> Les pluies de déclenchement ont été suivies d'une bonne reprise végétative sans sécheresse critique post-semis.
                  </>
                )
              )}
            </p>
          </div>

          {/* Chart 1: Rainfall & Cumulative */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card__title">
              <IconRain size={16} />
              <span>Pluviométrie journalière & Cumul (CHIRPS Daily)</span>
            </div>
            <div style={{ height: '240px', width: '100%' }}>
              <ReactECharts option={rainChartOption} style={{ height: '100%', width: '100%' }} />
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--fg-muted)', marginTop: '0.35rem', textAlign: 'center' }}>
              Ligne dorée = Seuil Sivakumar de déclenchement (20 mm en 3 jours après le 1er Juin).
            </div>
          </div>

          {/* Chart 2: NDVI Profile */}
          <div className="card">
            <div className="card__title">
              <IconLeaf size={16} />
              <span>Profil Phénologique NDVI (Sentinel-2 / MODIS)</span>
            </div>
            <div style={{ height: '240px', width: '100%' }}>
              <ReactECharts option={ndviChartOption} style={{ height: '100%', width: '100%' }} />
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--fg-muted)', marginTop: '0.35rem', textAlign: 'center' }}>
              Zone verte : NDVI observé 2026. Courbe pointillée : Référence historique médiane du secteur.
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
