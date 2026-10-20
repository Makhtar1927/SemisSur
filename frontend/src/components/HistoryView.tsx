import React, { useState, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { SectorResult, RainRecord } from '../lib/schemas'
import { IconHistory, IconInfo } from './Icons'

interface HistoryViewProps {
  results: SectorResult[]
  rainData: RainRecord[]
  wolofMode: boolean
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  results,
  wolofMode,
}) => {
  const [selectedCommune, setSelectedCommune] = useState<string>('all')

  // Unique communes
  const communes = useMemo(() => {
    const set = new Set<string>()
    results.forEach((r) => set.add(r.commune))
    return Array.from(set).sort()
  }, [results])

  // Filtered sectors
  const filteredSectors = useMemo(() => {
    if (selectedCommune === 'all') return results
    return results.filter((r) => r.commune === selectedCommune)
  }, [results, selectedCommune])

  // Chart 1: Sowing Dates distribution
  const dateDistChartOption = useMemo(() => {
    const datesMap = new Map<string, number>()
    filteredSectors.forEach((sec) => {
      const d = sec.season_start_date || 'Non détecté'
      datesMap.set(d, (datesMap.get(d) || 0) + 1)
    })

    const sortedDates = Array.from(datesMap.keys()).sort()
    const counts = sortedDates.map((d) => datesMap.get(d) || 0)

    return {
      title: {
        text: wolofMode ? 'Bes yi nit ñi jiyee' : 'Distribution des Dates de Démarrage des Semis',
        subtext: 'Nombre de secteurs ayant déclenché les critères Sivakumar',
        left: 'center',
        textStyle: { fontSize: 13, fontFamily: 'var(--font-title)' },
      },
      tooltip: { trigger: 'axis' },
      grid: { left: '5%', right: '5%', bottom: '15%', top: '22%' },
      xAxis: {
        type: 'category',
        data: sortedDates,
        axisLabel: { rotate: 25, fontSize: 11, fontFamily: 'var(--font-body)' },
      },
      yAxis: {
        type: 'value',
        name: 'Nb secteurs',
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.25 } },
      },
      series: [
        {
          name: 'Secteurs',
          type: 'bar',
          data: counts,
          itemStyle: {
            color: '#164E31',
            borderRadius: [4, 4, 0, 0],
          },
          label: { show: true, position: 'top', fontSize: 10 },
        },
      ],
    }
  }, [filteredSectors, wolofMode])

  // Chart 2: Dry Spells vs Trigger Rain Scatter
  const scatterOption = useMemo(() => {
    const data = filteredSectors
      .filter((s) => s.season_trigger_mm !== null)
      .map((s) => [
        s.season_trigger_mm,
        s.max_dry_days,
        s.nom,
        s.statut === 'signature_probable' ? 'Faux départ' : 'Normal',
      ])

    return {
      title: {
        text: wolofMode ? 'Taw ak Korite' : 'Pluie Déclenchante vs Longueur Séquence Sèche',
        subtext: 'Chaque point représente un secteur analysé',
        left: 'center',
        textStyle: { fontSize: 13, fontFamily: 'var(--font-title)' },
      },
      tooltip: {
        formatter: (param: any) => {
          const val = param.value
          return `<strong>${val[2]}</strong><br/>Cumul déclenchement : ${val[0]} mm<br/>Séquence sèche : ${val[1]} jours<br/>Statut : ${val[3]}`
        },
      },
      grid: { left: '8%', right: '8%', bottom: '15%', top: '22%' },
      xAxis: {
        type: 'value',
        name: 'Cumul 3j (mm)',
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.25 } },
      },
      yAxis: {
        type: 'value',
        name: 'Séquence sèche (jours)',
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.25 } },
      },
      series: [
        {
          name: 'Secteurs',
          type: 'scatter',
          symbolSize: 13,
          data: data,
          itemStyle: {
            color: (param: any) =>
              param.value[3] === 'Faux départ' ? '#D97706' : '#15803D',
          },
        },
      ],
    }
  }, [filteredSectors, wolofMode])

  return (
    <div className="page-container">
      {/* Header Info */}
      <section className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <IconHistory size={22} color="var(--clr-vert-semis)" />
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.65rem', fontWeight: 800, color: 'var(--clr-vert-semis)' }}>
            {wolofMode ? 'Taarix ak Waxtu ji ci Kaffrine' : 'Historique Agro-Climatique & Tendances des Semis'}
          </h1>
        </div>
        <p style={{ color: 'var(--fg-muted)', fontSize: '0.92rem', maxWidth: '850px' }}>
          Analyse rétrospective des 100 secteurs du bassin arachidier. Évaluation de la robustesse des démarrages de mousson, de la variabilité spatiale des premières pluies utiles et de la récurrence des poches de sécheresse post-semis.
        </p>

        <div style={{ marginTop: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filtrer par commune :</label>
          <select
            value={selectedCommune}
            onChange={(e) => setSelectedCommune(e.target.value)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--fg)',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          >
            <option value="all">Toutes les communes ({results.length} secteurs)</option>
            {communes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Two Main Charts */}
      <div className="grid grid--2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ height: '340px' }}>
            <ReactECharts option={dateDistChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div className="card">
          <div style={{ height: '340px' }}>
            <ReactECharts option={scatterOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Agronomic Recommendations based on historical analysis */}
      <div className="card">
        <h3 className="card__title">
          <IconInfo size={18} />
          <span>{wolofMode ? 'Xam-xam yi ñu ciy jële' : 'Enseignements Clés pour le Producteur'}</span>
        </h3>

        <div className="grid grid--3" style={{ gap: '1.25rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, color: 'var(--clr-vert-semis)', marginBottom: '0.35rem', fontSize: '0.92rem' }}>
              1. Le Piège des 20 mm Précoces
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--fg-muted)', lineHeight: '1.45' }}>
              Une pluie de 20 mm début juin est fréquente mais présente un risque élevé de pause pluviométrique supérieure à 8 jours. Attendre la confirmation par une seconde pluie avant de semer les variétés à cycle long.
            </p>
          </div>

          <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, color: 'var(--clr-or)', marginBottom: '0.35rem', fontSize: '0.92rem' }}>
              2. Échelonnement Variétal
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--fg-muted)', lineHeight: '1.45' }}>
              Privilégier le semis des céréales résistantes (mil Sanio/Souna) en premier front et réserver l'arachide (73-33 ou 55-437) dès que le profil d'humidité du sol atteint 25 cm de profondeur.
            </p>
          </div>

          <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, color: 'var(--clr-vert-semis)', marginBottom: '0.35rem', fontSize: '0.92rem' }}>
              3. Confirmation Optique NDVI
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--fg-muted)', lineHeight: '1.45' }}>
              Le suivi par satellite Sentinel-2 valide l'installation réelle 15 à 20 jours après le semis. Si l'indice NDVI ne dépasse pas 0.28, une alerte resemis est déclenchée.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
