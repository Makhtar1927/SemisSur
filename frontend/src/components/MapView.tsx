import React, { useState, useMemo, useEffect, useRef } from 'react'
import L from 'leaflet'
import type { SectorResult, SectorsGeoJson, RainRecord, NdviRecord, NdviRefRecord } from '../lib/schemas'
import { SectorDrawer } from './SectorDrawer'
import {
  IconSearch,
  IconWarning,
  IconCheck,
  IconMap,
  IconGrid,
  IconRain,
  IconSatellite,
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
  const [tileLayerType, setTileLayerType] = useState<'satellite' | 'osm'>('satellite')

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)

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

  // Initialize Leaflet Map with real Satellite and Geographic Base Maps
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return

    // Center on Kaffrine / Bassin Arachidier (Lat: 14.105, Lon: -15.550)
    const map = L.map(mapContainerRef.current, {
      center: [14.105, -15.550],
      zoom: 11,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: true,
    })

    // Add Esri World Imagery (Real High-Res Satellite View of Senegal)
    const satelliteTile = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
        maxZoom: 18,
      }
    )

    satelliteTile.addTo(map)
    tileLayerRef.current = satelliteTile
    leafletMapRef.current = map

    return () => {
      map.remove()
      leafletMapRef.current = null
      tileLayerRef.current = null
      geojsonLayerRef.current = null
    }
  }, [])

  // Switch Tile Base Layer (Satellite vs OpenStreetMap)
  useEffect(() => {
    if (!leafletMapRef.current) return

    if (tileLayerRef.current) {
      leafletMapRef.current.removeLayer(tileLayerRef.current)
    }

    if (tileLayerType === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri & Copernicus • Bassin arachidier',
          maxZoom: 18,
        }
      ).addTo(leafletMapRef.current)
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors • Sénégal',
          maxZoom: 18,
        }
      ).addTo(leafletMapRef.current)
    }
  }, [tileLayerType])

  // Update GeoJSON Polygons layer whenever sectorsGeoJson, results, or filters change
  useEffect(() => {
    if (!leafletMapRef.current || !sectorsGeoJson) return

    // Remove existing geojson layer if present
    if (geojsonLayerRef.current) {
      leafletMapRef.current.removeLayer(geojsonLayerRef.current)
      geojsonLayerRef.current = null
    }

    const geoLayer = L.geoJSON(sectorsGeoJson as any, {
      style: (feature) => {
        if (!feature) return {}
        const secId = feature.id as string
        const res = resultsBySector.get(secId)
        const statut = res?.statut || 'non_evalue'

        const isProbable = statut === 'signature_probable'
        const isExamine = statut === 'baisse_a_examiner'
        const isNormal = statut === 'pas_de_signature'

        const fillColor = isProbable
          ? '#D97706'
          : isExamine
          ? '#EA580C'
          : isNormal
          ? '#15803D'
          : '#64748B'

        const isSelected = selectedSectorId === secId
        const isFiltered =
          statusFilter === 'all'
            ? true
            : statut === statusFilter

        return {
          fillColor: fillColor,
          weight: isSelected ? 3 : 1.5,
          opacity: isFiltered ? 0.9 : 0.2,
          color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.75)',
          fillOpacity: isFiltered ? (isSelected ? 0.75 : 0.5) : 0.1,
        }
      },
      onEachFeature: (feature, layer) => {
        const secId = feature.id as string
        const res = resultsBySector.get(secId)
        if (!res) return

        // Tooltip content
        const tooltipHtml = `
          <div style="font-family: 'Outfit', sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
            <strong style="color: #164E31; font-size: 13px;">${res.nom}</strong><br/>
            <span>Commune : <strong>${res.commune}</strong></span><br/>
            <span>Semis : <strong>${res.season_start_date || 'Non détecté'}</strong></span><br/>
            <span>Séquence sèche : <strong>${res.max_dry_days} j</strong></span><br/>
            <span style="font-weight: 600; color: ${res.statut === 'signature_probable' ? '#D97706' : '#15803D'}">
              ${res.statut === 'signature_probable' ? '⚠️ Faux départ' : '✅ Normal'}
            </span>
          </div>
        `
        layer.bindTooltip(tooltipHtml, { sticky: true, opacity: 0.95 })

        // Interaction handlers
        layer.on({
          mouseover: (e) => {
            const target = e.target
            target.setStyle({
              weight: 3,
              color: '#FFFFFF',
              fillOpacity: 0.8,
            })
            target.bringToFront()
          },
          mouseout: (e) => {
            geoLayer.resetStyle(e.target)
          },
          click: () => {
            setSelectedSectorId(secId)
          },
        })
      },
    })

    geoLayer.addTo(leafletMapRef.current)
    geojsonLayerRef.current = geoLayer
  }, [sectorsGeoJson, resultsBySector, selectedSectorId, statusFilter])

  // Center Map on Kaffrine or Whole Senegal
  const handleZoomKaffrine = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([14.105, -15.550], 11)
    }
  }

  const handleZoomSenegal = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([14.497, -14.452], 7)
    }
  }

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
            height: '640px',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Real Leaflet Map Container */}
          <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%', zIndex: 1 }}
          />

          {/* Floating Top Controls Bar (Layer & Zoom Switcher) */}
          <div
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              zIndex: 500,
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Tile Layer Switcher */}
            <div style={{ background: 'var(--bg-card)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', gap: '0.25rem', boxShadow: 'var(--shadow-card)' }}>
              <button
                className={`btn btn--sm ${tileLayerType === 'satellite' ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => setTileLayerType('satellite')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                <IconSatellite size={13} />
                <span>Satellite Naturel</span>
              </button>
              <button
                className={`btn btn--sm ${tileLayerType === 'osm' ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => setTileLayerType('osm')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                <IconMap size={13} />
                <span>Carte & Villes</span>
              </button>
            </div>

            {/* Quick Geo Zoom Buttons */}
            <div style={{ background: 'var(--bg-card)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', gap: '0.25rem', boxShadow: 'var(--shadow-card)' }}>
              <button
                className="btn btn--secondary btn--sm"
                onClick={handleZoomKaffrine}
                title="Recentrer sur la zone Kaffrine"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                🎯 Kaffrine
              </button>
              <button
                className="btn btn--secondary btn--sm"
                onClick={handleZoomSenegal}
                title="Vue d'ensemble Sénégal"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
              >
                🇸🇳 Sénégal
              </button>
            </div>
          </div>

          {/* Floating Legend Bottom Left */}
          <div
            className="card floating-legend"
            style={{
              position: 'absolute',
              bottom: '22px',
              left: '22px',
              zIndex: 500,
              maxWidth: '320px',
              padding: '0.85rem 1.1rem',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '0.5rem', color: 'var(--clr-vert-semis)' }}>
              {wolofMode ? 'Melokaanoo yi' : 'Couche SemisSûr • Bassin Arachidier'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.76rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#15803D', display: 'inline-block' }} />
                <span>Semis normal (aucune pause critique)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#D97706', display: 'inline-block' }} />
                <span>Faux départ probable (pause sèche ≥ 8j)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EA580C', display: 'inline-block' }} />
                <span>Baisse NDVI à examiner</span>
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', paddingTop: '0.45rem', borderTop: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--fg-muted)' }}>
              Survol pour inspecter • Clic pour ouvrir la fiche
            </div>
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
