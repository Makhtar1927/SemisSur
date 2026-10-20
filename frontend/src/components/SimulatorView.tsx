import React, { useState, useMemo } from 'react'
import type { SectorResult, RainRecord, SensitivityJson } from '../lib/schemas'
import { detectSeasonStart, detectDrySpell } from '../lib/detection'

interface SimulatorViewProps {
  results: SectorResult[]
  rainData: RainRecord[]
  sensitivity: SensitivityJson | null
  wolofMode: boolean
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  results,
  rainData,
  sensitivity,
  wolofMode,
}) => {
  // Simulator Parameters State
  const [triggerRain, setTriggerRain] = useState<number>(20)
  const [accumDays, setAccumDays] = useState<number>(3)
  const [drySpellMaxDays, setDrySpellMaxDays] = useState<number>(8)
  const [dryDayThreshold, setDryDayThreshold] = useState<number>(1.0)
  const [startSearchDay, setStartSearchDay] = useState<string>('06-01')

  // Group rain data by sector
  const rainBySector = useMemo(() => {
    const map = new Map<string, { dates: string[]; rains: number[] }>()
    rainData.forEach((r) => {
      let entry = map.get(r.sector_id)
      if (!entry) {
        entry = { dates: [], rains: [] }
        map.set(r.sector_id, entry)
      }
      entry.dates.push(r.date)
      entry.rains.push(r.rain_mm)
    })
    return map
  }, [rainData])

  // Run dynamic recalculation on client side!
  const simulatedResults = useMemo(() => {
    const cfg = {
      start_search_day: startSearchDay,
      accum_days: accumDays,
      trigger_accum_mm: triggerRain,
      dry_spell_window_days: 30,
      dry_day_max_rain_mm: dryDayThreshold,
      dry_spell_min_duration_days: drySpellMaxDays,
    }

    let criticalDryCount = 0
    let detectedCount = 0

    const sectorSimulations = results.map((sec) => {
      const data = rainBySector.get(sec.sector_id)
      if (!data) {
        return {
          ...sec,
          sim_date: sec.season_start_date,
          sim_dry_days: sec.max_dry_days,
          sim_critical: sec.dry_is_critical,
        }
      }

      const seasonStart = detectSeasonStart(data.rains, data.dates, cfg)
      let simDate: string | null = null
      let simDryDays = 0
      let simCritical = false

      if (seasonStart) {
        detectedCount++
        simDate = seasonStart.date
        const dryAnalysis = detectDrySpell(data.rains, data.dates, seasonStart.date, cfg)
        simDryDays = dryAnalysis.max_dry_days
        simCritical = dryAnalysis.is_critical
        if (simCritical) criticalDryCount++
      }

      return {
        ...sec,
        sim_date: simDate,
        sim_dry_days: simDryDays,
        sim_critical: simCritical,
      }
    })

    return {
      sectors: sectorSimulations,
      detectedCount,
      criticalDryCount,
    }
  }, [results, rainBySector, triggerRain, accumDays, drySpellMaxDays, dryDayThreshold, startSearchDay])

  return (
    <div className="page-container">
      {/* Intro Header */}
      <section className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(232,176,74,0.1) 0%, rgba(31,92,58,0.08) 100%)' }}>
        <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', color: 'var(--clr-vert-semis)', marginBottom: '0.4rem' }}>
          🎛️ {wolofMode ? 'Nattukaay ak Séppukaay Paramètres' : 'Simulateur Interactif des Critères Sivakumar'}
        </h1>
        <p style={{ color: 'var(--fg-muted)', fontSize: '0.92rem', maxWidth: '850px' }}>
          Recalculez instantanément les dates de semis et la sensibilité aux faux départs sur les 100 secteurs avec le moteur TypeScript. Ajustez les seuils pluviométriques et observez l'impact direct.
        </p>
      </section>

      {/* Simulator Grid: Controls Left, Live Stats Right */}
      <div className="grid grid--2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Controls Card */}
        <div className="card">
          <h3 className="card__title">⚙️ Paramètres de Détection</h3>

          {/* Slider 1: Rain Trigger */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Pluie cumulée déclenchante :</label>
              <strong style={{ color: 'var(--clr-vert-semis)' }}>{triggerRain} mm</strong>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="1"
              value={triggerRain}
              onChange={(e) => setTriggerRain(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--clr-vert-semis)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--fg-muted)' }}>
              <span>10 mm (très précoce)</span>
              <span>20 mm (standard Sivakumar)</span>
              <span>40 mm (très prudent)</span>
            </div>
          </div>

          {/* Slider 2: Accumulation Days */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Fenêtre de cumul :</label>
              <strong style={{ color: 'var(--clr-vert-semis)' }}>{accumDays} jours</strong>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={accumDays}
              onChange={(e) => setAccumDays(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--clr-vert-semis)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--fg-muted)' }}>
              <span>1 jour (pluie orageuse unique)</span>
              <span>3 jours (standard)</span>
              <span>5 jours (lissé)</span>
            </div>
          </div>

          {/* Slider 3: Max Dry Spell */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>Séquence sèche critique post-semis :</label>
              <strong style={{ color: '#EF4444' }}>≥ {drySpellMaxDays} jours</strong>
            </div>
            <input
              type="range"
              min="5"
              max="15"
              step="1"
              value={drySpellMaxDays}
              onChange={(e) => setDrySpellMaxDays(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#EF4444' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--fg-muted)' }}>
              <span>5 jours (stricte)</span>
              <span>8 jours (standard Sahel)</span>
              <span>15 jours (tolérante)</span>
            </div>
          </div>

          {/* Start Search Day Dropdown */}
          <div>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
              Date de début de recherche :
            </label>
            <select
              value={startSearchDay}
              onChange={(e) => setStartSearchDay(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
                fontSize: '0.9rem',
              }}
            >
              <option value="05-15">15 Mai (très précoce)</option>
              <option value="06-01">1er Juin (standard Bassin arachidier)</option>
              <option value="06-15">15 Juin (tardif)</option>
            </select>
          </div>
        </div>

        {/* Live Comparison Results Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="card__title">📊 Impact en Temps Réel</h3>

            <div className="grid grid--2" style={{ gap: '1rem', margin: '1rem 0' }}>
              <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(31,92,58,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--fg-muted)' }}>Secteurs Déclenchés</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--clr-vert-semis)' }}>
                  {simulatedResults.detectedCount} / {results.length}
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  {Math.round((simulatedResults.detectedCount / results.length) * 100)}% de la zone
                </div>
              </div>

              <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(232,176,74,0.12)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--fg-muted)' }}>Faux Départs Simulés</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8A5A32' }}>
                  {simulatedResults.criticalDryCount}
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>
                  Séquence sèche ≥ {drySpellMaxDays}j
                </div>
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
              <strong>Comparaison avec les critères de référence :</strong>
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem', color: 'var(--fg-muted)', lineHeight: '1.5' }}>
                <li>Seuil par défaut : <strong>20 mm en 3j</strong> après le 01/06.</li>
                <li>Seuil simulé actuel : <strong>{triggerRain} mm en {accumDays}j</strong> après le {startSearchDay}.</li>
                <li>
                  Différence de détection :{' '}
                  <strong style={{ color: simulatedResults.detectedCount >= 100 ? '#10B981' : '#E8B04A' }}>
                    {simulatedResults.detectedCount - 100 >= 0 ? `+${simulatedResults.detectedCount - 100}` : simulatedResults.detectedCount - 100} secteurs
                  </strong>
                </li>
              </ul>
            </div>
          </div>

          <button
            className="btn btn--secondary"
            onClick={() => {
              setTriggerRain(20)
              setAccumDays(3)
              setDrySpellMaxDays(8)
              setDryDayThreshold(1.0)
              setStartSearchDay('06-01')
            }}
            style={{ marginTop: '1rem', alignSelf: 'flex-start' }}
          >
            🔄 Réinitialiser aux paramètres par défaut
          </button>
        </div>
      </div>

      {/* Comparison Table: Standard vs Simulated */}
      <div className="card">
        <h3 className="card__title">
          📋 Comparatif par Secteur (Échantillon représentatif)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--fg-muted)' }}>
                <th style={{ padding: '0.6rem' }}>Secteur</th>
                <th style={{ padding: '0.6rem' }}>Commune</th>
                <th style={{ padding: '0.6rem' }}>Date Standard (20mm/3j)</th>
                <th style={{ padding: '0.6rem' }}>Date Simulée ({triggerRain}mm/{accumDays}j)</th>
                <th style={{ padding: '0.6rem' }}>Séquence Sèche Simulée</th>
                <th style={{ padding: '0.6rem' }}>Statut Simulé</th>
              </tr>
            </thead>
            <tbody>
              {simulatedResults.sectors.slice(0, 10).map((sec) => (
                <tr key={sec.sector_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 600 }}>{sec.nom}</td>
                  <td style={{ padding: '0.6rem' }}>{sec.commune}</td>
                  <td style={{ padding: '0.6rem' }}>{sec.season_start_date || 'N/A'}</td>
                  <td style={{ padding: '0.6rem', color: sec.sim_date !== sec.season_start_date ? '#E8B04A' : 'inherit', fontWeight: sec.sim_date !== sec.season_start_date ? 700 : 400 }}>
                    {sec.sim_date || 'Non atteint'}
                  </td>
                  <td style={{ padding: '0.6rem', color: sec.sim_critical ? '#EF4444' : '#10B981' }}>
                    {sec.sim_dry_days} jours {sec.sim_critical && '⚠️'}
                  </td>
                  <td style={{ padding: '0.6rem' }}>
                    <span className={`pill ${sec.sim_critical ? 'pill--probable' : 'pill--aucune'}`}>
                      {sec.sim_critical ? 'Faux départ' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
