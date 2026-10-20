import React from 'react'

interface MethodologyViewProps {
  metadata: Record<string, any> | null
  wolofMode: boolean
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({
  metadata,
  wolofMode,
}) => {
  return (
    <div className="page-container">
      {/* Title */}
      <section className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(31,92,58,0.08) 0%, rgba(232,176,74,0.08) 100%)' }}>
        <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem', color: 'var(--clr-vert-semis)', marginBottom: '0.4rem' }}>
          📖 {wolofMode ? 'Xam-xam ak Teereb Données' : 'Méthodologie Scientifique & Traçabilité des Données'}
        </h1>
        <p style={{ color: 'var(--fg-muted)', fontSize: '0.95rem', maxWidth: '850px' }}>
          Conformité stricte à la règle d'or du Hackathon SENSAT 2026 : aucun résultat inventé.
          Chaque détection provient de données satellitaires réelles vérifiables et d'algorithmes agro-météorologiques reconnus au Sahel.
        </p>
      </section>

      {/* 2-Columns: Sivakumar & NDVI Validation */}
      <div className="grid grid--2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Method 1: Sivakumar */}
        <div className="card">
          <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🌧️</span>
            <span>Critères Agro-Climatiques de Sivakumar (1988)</span>
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--fg-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
            Dans la zone semi-aride ouest-africaine, le début de la saison culturale est défini selon la méthode historique validée par l'ICRISAT :
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <strong style={{ color: 'var(--clr-vert-semis)' }}>1. Déclenchement du Semis :</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                Cumul pluviométrique supérieur ou égal à <strong>20 mm en 1 à 3 jours</strong> consécutifs, survenant après le <strong>1er Juin</strong> (date charnière d'établissement de la Zone de Convergence Intertropicale - ZCIT).
              </div>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <strong style={{ color: '#E8B04A' }}>2. Détection du Faux Départ :</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                Survenue d'une séquence sèche de <strong>8 jours consécutifs ou plus</strong> avec pluie journalière &lt; 1,0 mm dans les <strong>30 jours</strong> qui suivent le déclenchement. Cette pause hydrique met en péril les plantules au stade de levée.
              </div>
            </div>
          </div>
        </div>

        {/* Method 2: Optical NDVI Validation */}
        <div className="card">
          <h3 className="card__title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🛰️</span>
            <span>Validation Optique Phénologique (NDVI Sentinel-2)</span>
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--fg-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
            La pluie seule ne garantit pas la réaction des cultures : nous combinons la météo avec la télédétection spatiale pour confirmer la signature biologique.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <strong style={{ color: '#10B981' }}>1. Émergence Végétative :</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                Observation de la dynamique du NDVI sur les parcelles agricoles (masque ESA WorldCover). L'apparition d'un pic vert 10 à 25 jours après la pluie confirme le semis effectif.
              </div>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <strong style={{ color: '#8A5A32' }}>2. Baisse & Reprise Végétative :</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>
                Une baisse relative du NDVI &ge; 15% coïncidant avec la pause pluviométrique confirme l'impact physiologique. Une reprise ultérieure valide le resemis ou la survie des plants.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Data Sources Table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card__title">📡 Sources Satellitaires Réelles & Licences</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--fg-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Donnée</th>
                <th style={{ padding: '0.75rem' }}>Fournisseur</th>
                <th style={{ padding: '0.75rem' }}>Résolution</th>
                <th style={{ padding: '0.75rem' }}>Licence</th>
                <th style={{ padding: '0.75rem' }}>Période / Date</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>CHIRPS Daily v2.0</td>
                <td style={{ padding: '0.75rem' }}>UC Santa Barbara / USGS</td>
                <td style={{ padding: '0.75rem' }}>0.05° (~5 km)</td>
                <td style={{ padding: '0.75rem' }}>
                  <span className="badge badge--real">Domaine public</span>
                </td>
                <td style={{ padding: '0.75rem' }}>Saison 2026 (Mai-Octobre)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>Sentinel-2 L2A MSI</td>
                <td style={{ padding: '0.75rem' }}>ESA / Copernicus</td>
                <td style={{ padding: '0.75rem' }}>10 m / Harmonisé 0.05°</td>
                <td style={{ padding: '0.75rem' }}>
                  <span className="badge badge--real">Copernicus Open Access</span>
                </td>
                <td style={{ padding: '0.75rem' }}>Séries décadaires</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>ESA WorldCover 2021</td>
                <td style={{ padding: '0.75rem' }}>ESA / VITO</td>
                <td style={{ padding: '0.75rem' }}>10 m (Classe 40 - Cropland)</td>
                <td style={{ padding: '0.75rem' }}>
                  <span className="badge badge--real">CC BY 4.0</span>
                </td>
                <td style={{ padding: '0.75rem' }}>2021 v200</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Download Datasets & Transparency Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card__title">💾 Téléchargement des Données Traitées (Open Data)</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--fg-muted)', marginBottom: '1rem' }}>
          Tous les jeux de données générés par le pipeline de calcul SemisSûr sont librement téléchargeables au format standardisé pour reproductibilité scientifique :
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href="data/processed/results.json"
            download="results.json"
            className="btn btn--secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            📥 results.json (100 secteurs)
          </a>
          <a
            href="data/processed/rain_daily.csv"
            download="rain_daily.csv"
            className="btn btn--secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            📥 rain_daily.csv (CHIRPS)
          </a>
          <a
            href="data/processed/ndvi_series.csv"
            download="ndvi_series.csv"
            className="btn btn--secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            📥 ndvi_series.csv (Sentinel-2)
          </a>
          <a
            href="data/processed/sectors.geojson"
            download="sectors.geojson"
            className="btn btn--secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            📥 sectors.geojson (Polygones)
          </a>
          <a
            href="data/processed/metadata.json"
            download="metadata.json"
            className="btn btn--secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            📥 metadata.json (Paramètres)
          </a>
        </div>
      </div>

      {/* Ethical Disclaimer */}
      <div className="card" style={{ borderLeft: '4px solid var(--clr-vert-semis)', background: 'rgba(31,92,58,0.04)' }}>
        <div style={{ fontWeight: 700, color: 'var(--clr-vert-semis)', marginBottom: '0.3rem' }}>
          ⚠️ Avertissement & Cadre d'Utilisation
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--fg-muted)', lineHeight: '1.45' }}>
          {metadata?.avertissement ||
            "Les valeurs NDVI et dates de semis sont des signaux agro-climatiques à vérifier sur place. Cet outil constitue une aide à la décision destinée à soutenir les producteurs, conseillers agricoles et techniciens, et ne se substitue pas aux avis officiels de l'ANACIM et du Ministère de l'Agriculture."}
        </p>
      </div>
    </div>
  )
}
