import React, { useState, useEffect } from 'react'
import { BrandLogo } from './BrandLogo'
import {
  IconMap,
  IconHistory,
  IconSliders,
  IconBook,
  IconSun,
  IconMoon,
  IconMenu,
  IconClose,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)

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

  const handleSelectTab = (tab: 'carte' | 'historique' | 'simulateur' | 'methodologie') => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <header className="navbar">
      <div className="navbar__container">
        {/* Official Brand Identity */}
        <BrandLogo
          size="md"
          showTagline={true}
          onClick={() => handleSelectTab('carte')}
        />

        {/* Desktop Segmented Navigation (Hidden on Mobile) */}
        <nav className="navbar__nav navbar__nav--desktop">
          <button
            className={`nav-btn ${activeTab === 'carte' ? 'nav-btn--active' : ''}`}
            onClick={() => handleSelectTab('carte')}
          >
            <IconMap size={16} />
            <span>{wolofMode ? 'Koos / Nataal' : 'Carte Interactive'}</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'historique' ? 'nav-btn--active' : ''}`}
            onClick={() => handleSelectTab('historique')}
          >
            <IconHistory size={16} />
            <span>{wolofMode ? 'Taarix 10 At' : 'Historique & Climat'}</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'simulateur' ? 'nav-btn--active' : ''}`}
            onClick={() => handleSelectTab('simulateur')}
          >
            <IconSliders size={16} />
            <span>{wolofMode ? 'Nattukaay' : 'Simulateur'}</span>
          </button>

          <button
            className={`nav-btn ${activeTab === 'methodologie' ? 'nav-btn--active' : ''}`}
            onClick={() => handleSelectTab('methodologie')}
          >
            <IconBook size={16} />
            <span>{wolofMode ? 'Xam-xam' : 'Méthode & Données'}</span>
          </button>
        </nav>

        {/* Desktop Actions */}
        <div className="navbar__actions navbar__actions--desktop">
          {/* Wolof / French Switcher */}
          <button
            className={`btn-pill-lang ${wolofMode ? 'btn-pill-lang--active' : ''}`}
            onClick={() => setWolofMode(!wolofMode)}
            title="Basculer vers les conseils en Wolof"
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>SN</span>
            <span style={{ fontWeight: 600 }}>{wolofMode ? 'Wolof' : 'Français'}</span>
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

        {/* Mobile Hamburger Button (Visible only on mobile/tablet) */}
        <button
          className="btn-hamburger"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Ouvrir le menu de navigation"
        >
          {isMobileMenuOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
        </button>
      </div>

      {/* Mobile Navigation Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="mobile-menu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Menu Header */}
            <div className="mobile-menu__header">
              <BrandLogo size="sm" showTagline={false} />
              <button
                className="btn-theme-toggle"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Fermer le menu"
              >
                <IconClose size={18} />
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <nav className="mobile-menu__nav">
              <button
                className={`mobile-nav-item ${activeTab === 'carte' ? 'mobile-nav-item--active' : ''}`}
                onClick={() => handleSelectTab('carte')}
              >
                <div className="mobile-nav-item__icon">
                  <IconMap size={20} />
                </div>
                <div>
                  <div className="mobile-nav-item__title">
                    {wolofMode ? 'Koos / Nataal' : 'Carte Interactive'}
                  </div>
                  <div className="mobile-nav-item__desc">
                    Cartographie satellite & 100 mailles
                  </div>
                </div>
              </button>

              <button
                className={`mobile-nav-item ${activeTab === 'historique' ? 'mobile-nav-item--active' : ''}`}
                onClick={() => handleSelectTab('historique')}
              >
                <div className="mobile-nav-item__icon">
                  <IconHistory size={20} />
                </div>
                <div>
                  <div className="mobile-nav-item__title">
                    {wolofMode ? 'Taarix 10 At' : 'Historique & Climat'}
                  </div>
                  <div className="mobile-nav-item__desc">
                    Distribution 2015-2026 & tendances
                  </div>
                </div>
              </button>

              <button
                className={`mobile-nav-item ${activeTab === 'simulateur' ? 'mobile-nav-item--active' : ''}`}
                onClick={() => handleSelectTab('simulateur')}
              >
                <div className="mobile-nav-item__icon">
                  <IconSliders size={20} />
                </div>
                <div>
                  <div className="mobile-nav-item__title">
                    {wolofMode ? 'Nattukaay' : 'Simulateur Sivakumar'}
                  </div>
                  <div className="mobile-nav-item__desc">
                    Recalcul des seuils en temps réel
                  </div>
                </div>
              </button>

              <button
                className={`mobile-nav-item ${activeTab === 'methodologie' ? 'mobile-nav-item--active' : ''}`}
                onClick={() => handleSelectTab('methodologie')}
              >
                <div className="mobile-nav-item__icon">
                  <IconBook size={20} />
                </div>
                <div>
                  <div className="mobile-nav-item__title">
                    {wolofMode ? 'Xam-xam' : 'Méthode & Données'}
                  </div>
                  <div className="mobile-nav-item__desc">
                    CHIRPS, Sentinel-2 & Open Data
                  </div>
                </div>
              </button>
            </nav>

            {/* Mobile Settings Section (Wolof + Theme) */}
            <div className="mobile-menu__footer">
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                {/* Language Switch */}
                <button
                  className={`btn btn--secondary ${wolofMode ? 'btn--primary' : ''}`}
                  onClick={() => setWolofMode(!wolofMode)}
                  style={{ flex: 1, padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                >
                  <span>🇸🇳</span>
                  <span>{wolofMode ? 'Langue : Wolof' : 'Langue : Français'}</span>
                </button>

                {/* Theme Switch */}
                <button
                  className="btn btn--secondary"
                  onClick={toggleTheme}
                  style={{ padding: '0.6rem 0.9rem' }}
                  title="Changer thème"
                >
                  {theme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
                </button>
              </div>

              <div style={{ fontSize: '0.74rem', color: 'var(--fg-muted)', textAlign: 'center' }}>
                SemisSûr • Hackathon SENSAT 2026
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
