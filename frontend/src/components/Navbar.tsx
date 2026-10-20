import React, { useState, useEffect } from 'react'

interface NavbarProps {
  activeTab: 'carte' | 'historique' | 'simulateur' | 'methodologie'
  setActiveTab: (tab: 'carte' | 'historique' | 'simulateur' | 'methodologie') => void
  wolofMode: boolean
  setWolofMode: (val: boolean) => void
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  wolofMode,
  setWolofMode
}) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('semissur_theme') as 'light' | 'dark' | null
    if (saved) {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('semissur_theme', next)
  }

  return (
    <header className="navbar">
      <div className="navbar__container">
        {/* Logo */}
        <div className="navbar__brand" onClick={() => setActiveTab('carte')} style={{ cursor: 'pointer' }}>
          <div className="navbar__logo-icon">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none">
              <circle cx="16" cy="16" r="15" fill="#8FD18A" fillOpacity="0.25" />
              <path d="M16 26V13" stroke="#1F5C3A" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M16 19C12 17 10 13 11 9C15 9 16 13 16 19Z" fill="#1F5C3A" />
              <path d="M16 16C20 14 22 10 21 6C17 6 16 10 16 16Z" fill="#8FD18A" />
              <circle cx="16" cy="27" r="2" fill="#E8B04A" />
            </svg>
          </div>
          <div>
            <div className="navbar__title">
              SemisSûr <span className="navbar__tag">Kaolack / Nioro</span>
            </div>
            <div className="navbar__subtitle">
              {wolofMode ? 'Koolute ci waxtu ji - SENSAT 2026' : 'Détection agro-climatique des dates de semis'}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="navbar__nav">
          <button
            className={`nav-btn ${activeTab === 'carte' ? 'nav-btn--active' : ''}`}
            onClick={() => setActiveTab('carte')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span>{wolofMode ? 'Koos / Nataal' : 'Carte Interactive'}</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'historique' ? 'nav-btn--active' : ''}`}
            onClick={() => setActiveTab('historique')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>{wolofMode ? 'Taarix 10 At' : 'Historique & Climat'}</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'simulateur' ? 'nav-btn--active' : ''}`}
            onClick={() => setActiveTab('simulateur')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="12" cy="10" r="2" />
              <circle cx="20" cy="14" r="2" />
            </svg>
            <span>{wolofMode ? 'Nattukaay' : 'Simulateur Sensibilité'}</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'methodologie' ? 'nav-btn--active' : ''}`}
            onClick={() => setActiveTab('methodologie')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{wolofMode ? 'Xam-xam & Données' : 'Méthode & Données'}</span>
          </button>
        </nav>

        {/* Actions */}
        <div className="navbar__actions">
          {/* Wolof toggle */}
          <button
            className={`btn-pill-lang ${wolofMode ? 'btn-pill-lang--active' : ''}`}
            onClick={() => setWolofMode(!wolofMode)}
            title="Basculer explications en Wolof"
          >
            <span>🇸🇳</span>
            <span style={{ fontWeight: 600 }}>{wolofMode ? 'Wolof' : 'FR'}</span>
          </button>

          {/* Theme switch */}
          <button
            className="btn-theme-toggle"
            onClick={toggleTheme}
            aria-label="Basculer thème sombre / clair"
            title="Basculer thème"
          >
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>

          {/* Hackathon badge */}
          <div className="badge badge--real" style={{ display: 'none' }}>
            <span>CHIRPS + NDVI</span>
          </div>
        </div>
      </div>
    </header>
  )
}
