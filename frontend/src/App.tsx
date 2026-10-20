import React, { useState, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { BrandLogo } from './components/BrandLogo'
import { MapView } from './components/MapView'
import { HistoryView } from './components/HistoryView'
import { SimulatorView } from './components/SimulatorView'
import { MethodologyView } from './components/MethodologyView'

import {
  loadSectors,
  loadResults,
  loadRainDaily,
  loadNdviSeries,
  loadNdviReference,
  loadSensitivity,
  loadMetadata,
} from './lib/data'
import type {
  SectorsGeoJson,
  SectorResult,
  RainRecord,
  NdviRecord,
  NdviRefRecord,
  SensitivityJson,
} from './lib/schemas'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'carte' | 'historique' | 'simulateur' | 'methodologie'>('carte')
  const [wolofMode, setWolofMode] = useState<boolean>(false)

  // Data states
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [sectorsGeoJson, setSectorsGeoJson] = useState<SectorsGeoJson | null>(null)
  const [results, setResults] = useState<SectorResult[]>([])
  const [rainData, setRainData] = useState<RainRecord[]>([])
  const [ndviData, setNdviData] = useState<NdviRecord[]>([])
  const [ndviRefData, setNdviRefData] = useState<NdviRefRecord[]>([])
  const [sensitivity, setSensitivity] = useState<SensitivityJson | null>(null)
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null)

  useEffect(() => {
    async function initData() {
      try {
        setLoading(true)
        setError(null)

        const [sectors, res, rain, ndvi, ndviRef, sens, meta] = await Promise.all([
          loadSectors(),
          loadResults(),
          loadRainDaily(),
          loadNdviSeries(),
          loadNdviReference(),
          loadSensitivity(),
          loadMetadata(),
        ])

        setSectorsGeoJson(sectors)
        setResults(res)
        setRainData(rain)
        setNdviData(ndvi)
        setNdviRefData(ndviRef)
        setSensitivity(sens)
        setMetadata(meta)
      } catch (err: any) {
        console.error('Failed to load SemisSûr dataset:', err)
        setError(err.message || 'Erreur lors du chargement des données traitées.')
      } finally {
        setLoading(false)
      }
    }

    initData()
  }, [])

  return (
    <div className="app-layout">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wolofMode={wolofMode}
        setWolofMode={setWolofMode}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {loading ? (
          <div className="loading-state" style={{ textAlign: 'center', padding: '6rem 1rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '48px', height: '48px', border: '4px solid var(--border)', borderTopColor: 'var(--clr-vert-semis)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--clr-vert-semis)', marginBottom: '0.5rem' }}>
              Chargement des données satellites...
            </h2>
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>
              Validation Zod des séries CHIRPS et NDVI en cours
            </p>
          </div>
        ) : error ? (
          <div className="card" style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', textAlign: 'center', borderColor: '#EF4444' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#EF4444', fontFamily: 'var(--font-title)', marginBottom: '0.75rem' }}>
              Erreur de chargement des données
            </h2>
            <p style={{ color: 'var(--fg-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </p>
            <button className="btn btn--primary" onClick={() => window.location.reload()}>
              🔄 Réessayer
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'carte' && (
              <MapView
                sectorsGeoJson={sectorsGeoJson}
                results={results}
                rainData={rainData}
                ndviData={ndviData}
                ndviRefData={ndviRefData}
                wolofMode={wolofMode}
              />
            )}

            {activeTab === 'historique' && (
              <HistoryView
                results={results}
                rainData={rainData}
                wolofMode={wolofMode}
              />
            )}

            {activeTab === 'simulateur' && (
              <SimulatorView
                results={results}
                rainData={rainData}
                sensitivity={sensitivity}
                wolofMode={wolofMode}
              />
            )}

            {activeTab === 'methodologie' && (
              <MethodologyView
                metadata={metadata}
                wolofMode={wolofMode}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer" style={{ borderTop: '1px solid var(--border)', padding: '2.5rem 1.5rem', background: 'var(--bg-card)', marginTop: '4rem' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <BrandLogo size="sm" showTagline={true} />
            <div style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', marginTop: '0.45rem', maxWidth: '420px' }}>
              Le satellite au service des semis, du bassin arachidier à tout le Sénégal. Développé pour le Hackathon National SENSAT 2026.
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: 'var(--fg-muted)', alignItems: 'center' }}>
            <span className="badge badge--real">CHIRPS Daily v2.0 (0.05°)</span>
            <span className="badge badge--real">Sentinel-2 L2A (10m)</span>
            <span className="badge badge--real">Critères Sivakumar (1988)</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
