import React, { useState, useEffect } from 'react'
import { BrandLogo } from './BrandLogo'
import {
  IconMap,
  IconHistory,
  IconSliders,
  IconBook,
  IconSun,
  IconMoon,
} from './Icons'

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
  setWolofMode,
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
        {/* Official Brand Identity */}
        <BrandLogo
          size="md"
          showTagline={true}
          onClick={() => setActiveTab('carte')}
        />

        {/* Segmented Navigation Controls */}
        <nav className="navbar__nav">
          <button
            className={`nav-btn ${activeTab === 'carte' ? 'nav-btn--active' : ''}`}
            onClick={() => setActiveTab('carte')}
          >
            <IconMap size={16} />
            <span>{wolofMode ? 'Koos / Nataal' : 'Carte Interactive'}</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'historique' ? 'nav-btn--active' : ''}`}
            onClick={() => setActiveTab('historique')}
          >
            <IconHistory size={16} />
            <span>{wolofMode ? 'Taarix 10 At' : 'Historique & Climat'}</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'simulateur' ? 'nav-btn--active' : ''}`}
            onClick={() => setActiveTab('simulateur')}
          >
            <IconSliders size={16} />
            <span>{wolofMode ? 'Nattukaay' : 'Simulateur'}</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'methodologie' ? 'nav-btn--active' : ''}`}
            onClick={() => setActiveTab('methodologie')}
          >
            <IconBook size={16} />
            <span>{wolofMode ? 'Xam-xam' : 'Méthode & Données'}</span>
          </button>
        </nav>

        {/* Global Action Tools */}
        <div className="navbar__actions">
          {/* Wolof / French Switcher */}
          <button
            className={`btn-pill-lang ${wolofMode ? 'btn-pill-lang--active' : ''}`}
            onClick={() => setWolofMode(!wolofMode)}
            title="Basculer vers les conseils en Wolof"
          >
            <span style={{ fontSize: '0.85rem' }}>SN</span>
            <span style={{ fontWeight: 700 }}>{wolofMode ? 'Wolof' : 'Français'}</span>
          </button>

          {/* Dark / Light Mode Switch */}
          <button
            className="btn-theme-toggle"
            onClick={toggleTheme}
            aria-label="Basculer thème sombre / clair"
            title="Basculer thème"
          >
            {theme === 'light' ? (
              <IconMoon size={18} color="var(--fg-secondary)" />
            ) : (
              <IconSun size={18} color="#E8B04A" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
