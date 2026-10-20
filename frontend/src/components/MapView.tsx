import React, { useState, useMemo } from 'react'
import type { SectorResult, SectorsGeoJson, RainRecord, NdviRecord, NdviRefRecord } from '../lib/schemas'
import { SectorDrawer } from './SectorDrawer'
import {
  IconSearch,
  IconWarning,
  IconCheck,
  IconMap,
  IconGrid,
  IconSatellite,
  IconRain,
  IconLeaf,
  IconInfo,
} from './Icons'

interface MapViewProps {
  sectorsGeoJson: SectorsGeoJson | null
  results: SectorResult[]
  rainData: RainRecord[]
  ndviData: NdviRecord[]
  ndviRefData: NdviRefRecord[]
  wolofMode: boolean
}

export const MapView: React.FC<MapViewProps> = ({
  sectorsGeoJson,
  results,
  rainData,
  ndviData,
  ndviRefData,
  wolofMode,
}) => {
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [viewMode, setViewMode] = useState<'carte' | 'grille'>('carte')
  const [hoveredSector, setHoveredSector] = useState<SectorResult | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)

  // Map results to sectorId
  const resultsBySector = useMemo(() => {
    const map = new Map<string, SectorResult>()
    results.forEach((r) => map.set(r.sector_id, r))
    return map
  }, [results])

  // Filtered sectors list
  const filteredResults = useMemo(() => {
    return results.filter((sec) => {
      const matchStatus =
        statusFilter === 'all' ? true : sec.statut === statusFilter
      const matchSearch =
        searchQuery === ''
          ? true
          : sec.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sec.commune.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sec.sector_id.toLowerCase().includes(searchQuery.toLowerCase())
      return matchStatus && matchSearch
    })
  }, [results, statusFilter, searchQuery])

  // Key KPI stats
  const kpiStats = useMemo(() => {
    const total = results.length
    const withStart = results.filter((r) => r.season_start_date)
    const probableCount = results.filter((r) => r.statut === 'signature_probable').length
    const normalCount = results.filter((r) => r.statut === 'pas_de_signature').length
    const avgCumul =
      withStart.length > 0
        ? Math.round(
            (withStart.reduce((acc, r) => acc + (r.season_trigger_mm || 0), 0) /
              withStart.length) *
              10
          ) / 10
        : 0

    return {
      total,
      detectedPct: total > 0 ? Math.round((withStart.length / total) * 100) : 0,
      probableCount,
      normalCount,
      avgCumul,
    }
  }, [results])

  // Selected Sector Object
  const selectedSector = useMemo(() => {
    if (!selectedSectorId) return null
    return resultsBySector.get(selectedSectorId) || null
  }, [selectedSectorId, resultsBySector])

  // Project GeoJSON Polygons into SVG Paths
  const svgPolygons = useMemo(() => {
    if (!sectorsGeoJson) return []

    const minLon = -15.630
    const maxLon = -15.470
    const minLat = 14.030
    const maxLat = 14.180

    const width = 800
    const height = 620
    const pad = 40

    return sectorsGeoJson.features.map((feat) => {
      const res = resultsBySector.get(feat.id as string)
      const coords = (feat.geometry.coordinates[0] as number[][]) || []

      const pathData = coords
        .map(([lon, lat], idx) => {
          const x = pad + ((lon - minLon) / (maxLon - minLon)) * (width - 2 * pad)
          const y = height - pad - ((lat - minLat) / (maxLat - minLat)) * (height - 2 * pad)
          return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
        })
        .join(' ') + ' Z'

      return {
        id: feat.id as string,
        path: pathData,
        res,
        properties: feat.properties,
      }
    })
  }, [sectorsGeoJson, resultsBySector])

  return (
    <div className="page-container">
      {/* Top Hero / KPI Section */}
      <section className="kpi-banner">
        <div className="grid grid--4">
          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">
                {wolofMode ? 'Mboolem Koos yi' : 'Secteurs Analysés'}
              </span>
              <div className="stat-card__icon">
                <IconMap size={16} />
              </div>
            </div>
            <div className="stat-card__value">{kpiStats.total}</div>
            <div className="stat-card__desc">Zone Kaffrine • 100 mailles agricoles</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">
                {wolofMode ? 'Taw yu am jiwu' : 'Déclenchement du Semis'}
              </span>
              <div className="stat-card__icon" style={{ background: 'var(--clr-vert-light)', color: 'var(--clr-vert-semis)' }}>
                <IconCheck size={16} />
              </div>
            </div>
            <div className="stat-card__value" style={{ color: 'var(--clr-vert-semis)' }}>
              {kpiStats.detectedPct}%
            </div>
            <div className="stat-card__desc">Critère Sivakumar 20mm atteint</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">
                {wolofMode ? 'Moytul / Fàcc' : 'Faux Départs Détectés'}
              </span>
              <div className="stat-card__icon" style={{ background: 'var(--clr-or-light)', color: 'var(--clr-or)' }}>
                <IconWarning size={16} />
              </div>
            </div>
            <div className="stat-card__value" style={{ color: 'var(--clr-or)' }}>
              {kpiStats.probableCount}
            </div>
            <div className="stat-card__desc">Séquence sèche critique ≥ 8 jours</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">
                {wolofMode ? 'Moyenne taw bi' : 'Pluie Moy. Déclenchement'}
              </span>
              <div className="stat-card__icon">
                <IconRain size={16} />
              </div>
            </div>
            <div className="stat-card__value">{kpiStats.avgCumul} <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>mm</span></div>
            <div className="stat-card__desc">Cumul sur 3 jours consécutifs</div>
          </div>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <div className="card control-bar" style={{ margin: '1.25rem 0', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 240px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', color: 'var(--fg-muted)', display: 'flex' }}>
              <IconSearch size={16} />
            </span>
            <input
              type="text"
              placeholder={wolofMode ? 'Wër benn koos...' : 'Rechercher un secteur, une commune...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
                fontSize: '0.88rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Status buttons */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn--sm ${statusFilter === 'all' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setStatusFilter('all')}
            >
              Tous ({results.length})
            </button>
            <button
              className={`btn btn--sm ${statusFilter === 'signature_probable' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setStatusFilter('signature_probable')}
            >
              <IconWarning size={14} />
              <span>Faux départs ({kpiStats.probableCount})</span>
            </button>
            <button
              className={`btn btn--sm ${statusFilter === 'pas_de_signature' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setStatusFilter('pas_de_signature')}
            >
              <IconCheck size={14} />
              <span>Semis normal ({kpiStats.normalCount})</span>
            </button>
          </div>

          {/* View toggle (Map / Cards) */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              className={`btn btn--sm ${viewMode === 'carte' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setViewMode('carte')}
              title="Affichage Carte"
            >
              <IconMap size={14} />
              <span>{wolofMode ? 'Nataal' : 'Carte'}</span>
            </button>
            <button
              className={`btn btn--sm ${viewMode === 'grille' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setViewMode('grille')}
              title="Affichage Grille"
            >
              <IconGrid size={14} />
              <span>{wolofMode ? 'Limm' : 'Grille'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'carte' ? (
        <div
          className="map-wrapper"
          style={{
            position: 'relative',
            height: '620px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* SVG Vector Choropleth Map */}
          <svg
            viewBox="0 0 800 620"
            style={{ width: '100%', height: '100%' }}
          >
            {/* Background Subtly Textured Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(22, 78, 49, 0.04)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Sectors Polygons */}
            {svgPolygons.map(({ id, path, res }) => {
              const isSelected = selectedSectorId === id
              const isProbable = res?.statut === 'signature_probable'
              const isExamine = res?.statut === 'baisse_a_examiner'
              const isNormal = res?.statut === 'pas_de_signature'

              const fillColor = isProbable
                ? '#D97706'
                : isExamine
                ? '#EA580C'
                : isNormal
                ? '#15803D'
                : '#64748B'

              const opacity =
                statusFilter === 'all'
                  ? 0.78
                  : res?.statut === statusFilter
                  ? 0.92
                  : 0.15

              return (
                <path
                  key={id}
                  d={path}
                  fill={fillColor}
                  fillOpacity={opacity}
                  stroke={isSelected ? '#0F172A' : '#FFFFFF'}
                  strokeWidth={isSelected ? 2.8 : 1}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (res) {
                      setHoveredSector(res)
                      setTooltipPos({ x: e.clientX, y: e.clientY })
                    }
                  }}
                  onMouseMove={(e) => {
                    setTooltipPos({ x: e.clientX, y: e.clientY })
                  }}
                  onMouseLeave={() => {
                    setHoveredSector(null)
                  }}
                  onClick={() => setSelectedSectorId(id)}
                />
              )
            })}
          </svg>

          {/* Floating Hover Tooltip */}
          {hoveredSector && tooltipPos && (
            <div
              style={{
                position: 'fixed',
                top: tooltipPos.y - 110,
                left: tooltipPos.x + 15,
                zIndex: 1000,
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#FFFFFF',
                padding: '0.65rem 0.9rem',
                borderRadius: '8px',
                pointerEvents: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                fontSize: '0.82rem',
                lineHeight: '1.4',
                maxWidth: '240px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#8FD18A', marginBottom: '0.2rem' }}>
                {hoveredSector.nom}
              </div>
              <div>Commune : <strong>{hoveredSector.commune}</strong></div>
              <div>Semis : <strong>{hoveredSector.season_start_date || 'Non détecté'}</strong></div>
              <div>Séquence sèche : <strong>{hoveredSector.max_dry_days} jours</strong></div>
              <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '0.74rem', color: '#E8B04A' }}>
                Cliquer pour ouvrir la fiche détaillée
              </div>
            </div>
          )}

          {/* Floating Legend */}
          <div
            className="card floating-legend"
            style={{
              position: 'absolute',
              bottom: '18px',
              left: '18px',
              zIndex: 10,
              maxWidth: '300px',
              padding: '0.85rem 1rem',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem', color: 'var(--clr-vert-semis)' }}>
              {wolofMode ? 'Melokaanoo yi' : 'Statut de la Campagne'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#15803D', display: 'inline-block' }} />
                <span>Semis normal (aucun faux départ)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#D97706', display: 'inline-block' }} />
                <span>Faux départ probable (pause hydrique ≥ 8j)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EA580C', display: 'inline-block' }} />
                <span>Baisse NDVI à examiner</span>
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10 }}>
            <span className="badge badge--real" style={{ background: 'var(--bg-card)' }}>
              Bassin arachidier • 100 Secteurs
            </span>
          </div>
        </div>
      ) : (
        /* Grid / Card View of Sectors */
        <div className="grid grid--3" style={{ gap: '1rem' }}>
          {filteredResults.map((sec) => (
            <div
              key={sec.sector_id}
              className="card card--interactive sector-preview-card"
              onClick={() => setSelectedSectorId(sec.sector_id)}
              style={{
                borderLeft: `4px solid ${
                  sec.statut === 'signature_probable'
                    ? '#D97706'
                    : sec.statut === 'baisse_a_examiner'
                    ? '#EA580C'
                    : '#15803D'
                }`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <span className="badge badge--real" style={{ fontSize: '0.7rem' }}>
                  {sec.sector_id}
                </span>
                <span
                  className={`pill pill--${
                    sec.statut === 'signature_probable'
                      ? 'probable'
                      : sec.statut === 'baisse_a_examiner'
                      ? 'examine'
                      : 'aucune'
                  }`}
                >
                  {sec.statut === 'signature_probable'
                    ? 'Faux départ'
                    : sec.statut === 'baisse_a_examiner'
                    ? 'À examiner'
                    : 'Normal'}
                </span>
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.98rem', marginBottom: '0.2rem' }}>
                {sec.nom}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', marginBottom: '0.75rem' }}>
                Commune : <strong>{sec.commune}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                <span>Date semis :</span>
                <strong>{sec.season_start_date || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                <span>Séquence sèche :</span>
                <strong style={{ color: sec.dry_is_critical ? 'var(--clr-alerte)' : 'inherit' }}>
                  {sec.max_dry_days} jours
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sector Detailed Drawer Modal */}
      <SectorDrawer
        sector={selectedSector}
        rainData={rainData}
        ndviData={ndviData}
        ndviRefData={ndviRefData}
        wolofMode={wolofMode}
        onClose={() => setSelectedSectorId(null)}
      />
    </div>
  )
}
