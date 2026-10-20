import React, { useState, useMemo, useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
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

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

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

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current || !sectorsGeoJson || mapInstanceRef.current) return

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '&copy; OpenStreetMap contributors',
            },
          },
          layers: [
            {
              id: 'osm-layer',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [-15.55, 14.10],
        zoom: 10.5,
      })

      map.addControl(new maplibregl.NavigationControl(), 'top-right')

      map.on('load', () => {
        // Enrich GeoJSON with results
        const enrichedGeoJson = {
          ...sectorsGeoJson,
          features: sectorsGeoJson.features.map((feat) => {
            const res = resultsBySector.get(feat.id as string)
            return {
              ...feat,
              properties: {
                ...feat.properties,
                statut: res?.statut || 'non_evalue',
                season_start_date: res?.season_start_date || 'Non détecté',
                max_dry_days: res?.max_dry_days || 0,
              },
            }
          }),
        }

        map.addSource('sectors-source', {
          type: 'geojson',
          data: enrichedGeoJson as any,
        })

        // Polygons layer with status color match
        map.addLayer({
          id: 'sectors-fill',
          type: 'fill',
          source: 'sectors-source',
          paint: {
            'fill-color': [
              'match',
              ['get', 'statut'],
              'signature_probable',
              '#E8B04A',
              'baisse_a_examiner',
              '#F4A261',
              'pas_de_signature',
              '#10B981',
              '#9CA3AF',
            ],
            'fill-opacity': 0.65,
          },
        })

        // Borders layer
        map.addLayer({
          id: 'sectors-line',
          type: 'line',
          source: 'sectors-source',
          paint: {
            'line-color': '#1F5C3A',
            'line-width': 1.8,
          },
        })

        // Hover effect cursor
        map.on('mouseenter', 'sectors-fill', () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', 'sectors-fill', () => {
          map.getCanvas().style.cursor = ''
        })

        // Click handler on sector
        map.on('click', 'sectors-fill', (e: any) => {
          if (e.features && e.features[0]) {
            const clickedId = e.features[0].id as string
            setSelectedSectorId(clickedId)
          }
        })
      })

      mapInstanceRef.current = map
    } catch (err) {
      console.warn('MapLibre init error (fallback rendering is active):', err)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
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
        <div className="map-wrapper" style={{ position: 'relative', height: '620px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* MapLibre DOM Node */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Floating Legend */}
          <div className="card floating-legend" style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 10, maxWidth: '280px', padding: '0.85rem' }}>
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
