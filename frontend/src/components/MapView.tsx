import React, { useState, useMemo } from 'react'
import type { SectorResult, SectorsGeoJson, RainRecord, NdviRecord, NdviRefRecord } from '../lib/schemas'
import { SectorDrawer } from './SectorDrawer'

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

    // Bounds for Kaffrine box
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
            <div className="stat-card__label">
              {wolofMode ? 'Mboolem Koos yi' : 'Secteurs Analysés'}
            </div>
            <div className="stat-card__value">{kpiStats.total}</div>
            <div className="stat-card__desc">Zone Kaffrine / Bassin arachidier</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">
              {wolofMode ? 'Taw yu am jiwu' : 'Déclenchement du Semis'}
            </div>
            <div className="stat-card__value" style={{ color: '#10B981' }}>
              {kpiStats.detectedPct}%
            </div>
            <div className="stat-card__desc">Seuil Sivakumar 20mm atteint</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">
              {wolofMode ? 'Moytul / Fàcc' : 'Faux Départs Détectés'}
            </div>
            <div className="stat-card__value" style={{ color: '#E8B04A' }}>
              {kpiStats.probableCount}
            </div>
            <div className="stat-card__desc">Séquence sèche critique ≥ 8j post-semis</div>
          </div>

          <div className="stat-card">
            <div className="stat-card__label">
              {wolofMode ? 'Moyenne taw bi' : 'Pluie Moy. Déclenchement'}
            </div>
            <div className="stat-card__value">{kpiStats.avgCumul} mm</div>
            <div className="stat-card__desc">Cumul 3 jours consécutifs</div>
          </div>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <div className="card control-bar" style={{ margin: '1.25rem 0', padding: '0.85rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 240px' }}>
            <span style={{ color: 'var(--fg-muted)' }}>🔍</span>
            <input
              type="text"
              className="input-search"
              placeholder={wolofMode ? 'Wër benn koos...' : 'Rechercher un secteur ou commune...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.8rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Status buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn--sm ${statusFilter === 'all' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setStatusFilter('all')}
            >
              Tous ({results.length})
            </button>
            <button
              className={`btn btn--sm ${statusFilter === 'signature_probable' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setStatusFilter('signature_probable')}
              style={{ borderColor: 'rgba(232, 176, 74, 0.6)' }}
            >
              ⚠️ Faux départs ({kpiStats.probableCount})
            </button>
            <button
              className={`btn btn--sm ${statusFilter === 'pas_de_signature' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setStatusFilter('pas_de_signature')}
            >
              ✅ Semis normal ({kpiStats.normalCount})
            </button>
          </div>

          {/* View toggle (Map / Cards) */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              className={`btn btn--sm ${viewMode === 'carte' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setViewMode('carte')}
              title="Affichage Carte"
            >
              🗺️ {wolofMode ? 'Nataal' : 'Carte'}
            </button>
            <button
              className={`btn btn--sm ${viewMode === 'grille' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setViewMode('grille')}
              title="Affichage Grille"
            >
              📋 {wolofMode ? 'Limm' : 'Grille'}
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
            background: 'linear-gradient(180deg, rgba(31,92,58,0.03) 0%, rgba(232,176,74,0.03) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* SVG Vector Choropleth Map */}
          <svg
            viewBox="0 0 800 620"
            style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.06))' }}
          >
            {/* Background Map Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(31,92,58,0.06)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Sectors Polygons */}
            {svgPolygons.map(({ id, path, res, properties }) => {
              const isSelected = selectedSectorId === id
              const isProbable = res?.statut === 'signature_probable'
              const isExamine = res?.statut === 'baisse_a_examiner'
              const isNormal = res?.statut === 'pas_de_signature'

              const fillColor = isProbable
                ? '#E8B04A'
                : isExamine
                ? '#F4A261'
                : isNormal
                ? '#10B981'
                : '#9CA3AF'

              const opacity =
                statusFilter === 'all'
                  ? 0.72
                  : res?.statut === statusFilter
                  ? 0.85
                  : 0.2

              return (
                <path
                  key={id}
                  d={path}
                  fill={fillColor}
                  fillOpacity={opacity}
                  stroke={isSelected ? '#1F5C3A' : 'rgba(255,255,255,0.85)'}
                  strokeWidth={isSelected ? 3 : 1.2}
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
                background: 'rgba(27, 42, 34, 0.95)',
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
              <div>📍 Commune : <strong>{hoveredSector.commune}</strong></div>
              <div>📅 Semis : <strong>{hoveredSector.season_start_date || 'Non détecté'}</strong></div>
              <div>⏳ Séquence sèche : <strong>{hoveredSector.max_dry_days} jours</strong></div>
              <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem', color: '#E8B04A' }}>
                👉 Cliquer pour ouvrir la fiche détaillée
              </div>
            </div>
          )}

          {/* Floating Legend */}
          <div
            className="card floating-legend"
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              zIndex: 10,
              maxWidth: '300px',
              padding: '0.85rem',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--clr-vert-semis)' }}>
              {wolofMode ? 'Melokaanoo yi' : 'Légende Statut Semis'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#10B981', display: 'inline-block' }} />
                <span>Semis normal (aucun faux départ)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#E8B04A', display: 'inline-block' }} />
                <span>Signature de faux départ probable</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#F4A261', display: 'inline-block' }} />
                <span>Baisse NDVI à examiner</span>
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10, display: 'flex', gap: '0.5rem' }}>
            <span className="badge badge--real" style={{ background: 'var(--bg-card)' }}>
              100 Secteurs géolocalisés (Kaffrine)
            </span>
          </div>
        </div>
      ) : (
        /* Grid / Card View of Sectors */
        <div className="grid grid--3" style={{ gap: '1rem' }}>
          {filteredResults.map((sec) => (
            <div
              key={sec.sector_id}
              className="card sector-preview-card"
              onClick={() => setSelectedSectorId(sec.sector_id)}
              style={{
                cursor: 'pointer',
                borderLeft: `5px solid ${
                  sec.statut === 'signature_probable'
                    ? '#E8B04A'
                    : sec.statut === 'baisse_a_examiner'
                    ? '#F4A261'
                    : '#10B981'
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
                <strong style={{ color: sec.dry_is_critical ? '#EF4444' : 'inherit' }}>
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
