import React from 'react'
import {
  IconBook,
  IconRain,
  IconSatellite,
  IconLeaf,
  IconDownload,
  IconWarning,
  IconInfo,
} from './Icons'

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
      <section className="card" style={{ marginBottom: '1.5rem', background: 'var(--bg-card)' }}>
        <div className="page-header-row">
          <div className="page-icon">
            <IconBook size={24} color="var(--clr-vert-semis)" />
          </div>
          <h1 className="page-header-title">
            {wolofMode ? 'Xam-xam ak Teereb Données' : 'Méthodologie Scientifique & Traçabilité des Données'}
          </h1>
        </div>
        <p style={{ color: 'var(--fg-muted)', fontSize: '0.92rem', maxWidth: '850px', lineHeight: 1.5 }}>
          Conformité stricte à la règle d'or du Hackathon SENSAT 2026 : aucun résultat inventé.
          Chaque détection provient de données satellitaires réelles vérifiables et d'algorithmes agro-météorologiques reconnus au Sahel.
        </p>
      </section>

      {/* 2-Columns: Sivakumar & NDVI Validation */}
      <div className="grid grid--2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Method 1: Sivakumar */}
        <div className="card">
          <h3 className="card__title">
            <IconRain size={18} />
            <span>Critères Agro-Climatiques de Sivakumar (1988)</span>
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--fg-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
            Dans la zone semi-aride ouest-africaine, le début de la saison culturale est défini selon la méthode historique validée par l'ICRISAT :
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <strong style={{ color: 'var(--clr-vert-semis)', fontSize: '0.9rem' }}>1. Déclenchement du Semis :</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '0.25rem', color: 'var(--fg-secondary)', lineHeight: '1.45' }}>
                Cumul pluviométrique supérieur ou égal à <strong>20 mm en 1 à 3 jours</strong> consécutifs, survenant après le <strong>1er Juin</strong> (date charnière d'établissement de la Zone de Convergence Intertropicale - ZCIT).
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <strong style={{ color: 'var(--clr-or)', fontSize: '0.9rem' }}>2. Détection du Faux Départ :</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '0.25rem', color: 'var(--fg-secondary)', lineHeight: '1.45' }}>
                Survenue d'une séquence sèche de <strong>8 jours consécutifs ou plus</strong> avec pluie journalière &lt; 1,0 mm dans les <strong>30 jours</strong> qui suivent le déclenchement. Cette pause hydrique met en péril les plantules au stade de levée.
              </div>
            </div>
          </div>
        </div>

        {/* Method 2: Optical NDVI Validation */}
        <div className="card">
          <h3 className="card__title">
            <IconSatellite size={18} />
            <span>Validation Optique Phénologique (NDVI Sentinel-2)</span>
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--fg-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
            La pluie seule ne garantit pas la réaction des cultures : nous combinons la météo avec la télédétection spatiale pour confirmer la signature biologique.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <strong style={{ color: 'var(--clr-vert-semis)', fontSize: '0.9rem' }}>1. Émergence Végétative :</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '0.25rem', color: 'var(--fg-secondary)', lineHeight: '1.45' }}>
                Observation de la dynamique du NDVI sur les parcelles agricoles (masque ESA WorldCover). L'apparition d'un pic vert 10 à 25 jours après la pluie confirme le semis effectif.
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              <strong style={{ color: 'var(--clr-or)', fontSize: '0.9rem' }}>2. Baisse & Reprise Végétative :</strong>
              <div style={{ fontSize: '0.82rem', marginTop: '0.25rem', color: 'var(--fg-secondary)', lineHeight: '1.45' }}>
                Une baisse relative du NDVI &ge; 15% coïncidant avec la pause pluviométrique confirme l'impact physiologique. Une reprise ultérieure valide le resemis ou la survie des plants.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Data Sources Table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card__title">
          <IconSatellite size={18} />
          <span>Sources Satellitaires Réelles & Licences</span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
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

      {/* Stakeholders & Decision Matrix (Section 4 du Dossier Candidature) */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card__title">
          <IconInfo size={18} />
          <span>Qui Utilise SemisSûr & Pour Quelle Décision ?</span>
        </h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--fg-muted)', marginBottom: '1rem' }}>
          Conformité avec les acteurs institutionnels sénégalais associés au Hackathon SENSAT :
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--fg-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Acteur / Institution</th>
                <th style={{ padding: '0.75rem' }}>Ce qu'il reçoit</th>
                <th style={{ padding: '0.75rem' }}>Décision Préparée & Action Concrète</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--clr-vert-semis)' }}>
                  Conseiller Agricole & Coopératives (ANCAR)
                </td>
                <td style={{ padding: '0.75rem' }}>Tableau de bord par zone & alertes de pause sèche</td>
                <td style={{ padding: '0.75rem' }}>Identifier les villages à visiter en priorité, conseiller de semer ou d'attendre.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--clr-vert-semis)' }}>
                  Agriculteurs & Producteurs
                </td>
                <td style={{ padding: '0.75rem' }}>Message simple vocal ou SMS en Wolof et Français</td>
                <td style={{ padding: '0.75rem' }}>Semer immédiatement ou temporiser ; vérifier le taux de levée en cas de pause sèche.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--clr-vert-semis)' }}>
                  Ministère de l'Agriculture (DAPSA / DPV)
                </td>
                <td style={{ padding: '0.75rem' }}>Cartographie objective des pertes de début de saison</td>
                <td style={{ padding: '0.75rem' }}>Cibler l'envoi de semences de ressemis en urgence sans attendre les enquêtes tardives.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--clr-vert-semis)' }}>
                  Assurance Agricole Indicielle (CNAAS)
                </td>
                <td style={{ padding: '0.75rem' }}>Indice objectif et vérifiable de sinistre par maille</td>
                <td style={{ padding: '0.75rem' }}>Valider et déclencher plus rapidement l'indemnisation ou l'aide post-sinistre.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* United Nations Sustainable Development Goals (ODD) Section 9 */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card__title">
          <IconBook size={18} />
          <span>Contribution aux Objectifs de Développement Durable (Agenda 2030)</span>
        </h3>
        <div className="grid grid--3" style={{ gap: '1rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ background: '#DDA63A', color: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}>ODD 2</span>
              <strong style={{ fontSize: '0.88rem' }}>Faim « Zéro »</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-vert-semis)', fontWeight: 700, marginBottom: '0.3rem' }}>Cibles 2.3 & 2.4</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--fg-muted)', lineHeight: '1.45' }}>
              Sécurisation des rendements d'arachide et céréales vivrières en éliminant les pertes de semences et en accélérant les réapprovisionnements.
            </p>
          </div>

          <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ background: '#3F7E44', color: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}>ODD 13</span>
              <strong style={{ fontSize: '0.88rem' }}>Action Climatique</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-vert-semis)', fontWeight: 700, marginBottom: '0.3rem' }}>Cible 13.1</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--fg-muted)', lineHeight: '1.45' }}>
              Renforcement de la résilience face à l'irrégularité accrue des moussons sahéliennes par la surveillance satellitaire objective des faux départs.
            </p>
          </div>

          <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ background: '#E5243B', color: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}>ODD 1</span>
              <strong style={{ fontSize: '0.88rem' }}>Pas de Pauvreté</strong>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-vert-semis)', fontWeight: 700, marginBottom: '0.3rem' }}>Cible 1.5</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--fg-muted)', lineHeight: '1.45' }}>
              Protection des petits exploitants contre le surendettement lié au rachat imprévu de semences grâce à des preuves de sinistre certifiées.
            </p>
          </div>
        </div>
      </div>

      {/* Download Datasets & Transparency Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card__title">
          <IconDownload size={18} />
          <span>Téléchargement des Données Traitées (Open Data)</span>
        </h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--fg-muted)', marginBottom: '1rem' }}>
          Tous les jeux de données générés par le pipeline de calcul SemisSûr sont librement téléchargeables au format standardisé pour reproductibilité scientifique :
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href="data/processed/results.json"
            download="results.json"
            className="btn btn--secondary"
          >
            <IconDownload size={15} />
            <span>results.json (100 secteurs)</span>
          </a>
          <a
            href="data/processed/rain_daily.csv"
            download="rain_daily.csv"
            className="btn btn--secondary"
          >
            <IconDownload size={15} />
            <span>rain_daily.csv (CHIRPS)</span>
          </a>
          <a
            href="data/processed/ndvi_series.csv"
            download="ndvi_series.csv"
            className="btn btn--secondary"
          >
            <IconDownload size={15} />
            <span>ndvi_series.csv (Sentinel-2)</span>
          </a>
          <a
            href="data/processed/sectors.geojson"
            download="sectors.geojson"
            className="btn btn--secondary"
          >
            <IconDownload size={15} />
            <span>sectors.geojson (Polygones)</span>
          </a>
          <a
            href="data/processed/metadata.json"
            download="metadata.json"
            className="btn btn--secondary"
          >
            <IconDownload size={15} />
            <span>metadata.json (Paramètres)</span>
          </a>
        </div>
      </div>

      {/* Ethical Disclaimer */}
      <div className="card" style={{ borderLeft: '4px solid var(--clr-vert-semis)', background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: 'var(--clr-vert-semis)', marginBottom: '0.35rem' }}>
          <IconWarning size={16} />
          <span>Avertissement & Cadre d'Utilisation</span>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--fg-muted)', lineHeight: '1.45' }}>
          {metadata?.avertissement ||
            "Les valeurs NDVI et dates de semis sont des signaux agro-climatiques à vérifier sur place. Cet outil constitue une aide à la décision destinée à soutenir les producteurs, conseillers agricoles et techniciens, et ne se substitue pas aux avis officiels de l'ANACIM et du Ministère de l'Agriculture."}
        </p>
      </div>
    </div>
  )
}
