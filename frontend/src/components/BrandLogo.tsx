import React from 'react'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  onClick?: () => void
  className?: string
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = true,
  onClick,
  className = '',
}) => {
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 56 : 42

  return (
    <div
      onClick={onClick}
      className={`brand-logo brand-logo--${size} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '0.65rem' : '0.85rem',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      {/* Official Emblem Icon SVG (exact vector reproduction of official identity) */}
      <div
        className="brand-logo__emblem"
        style={{
          width: iconSize,
          height: iconSize,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <svg
          viewBox="0 0 200 200"
          width={iconSize}
          height={iconSize}
          style={{ overflow: 'visible', filter: 'drop-shadow(0 2px 8px rgba(31,92,58,0.18))' }}
        >
          {/* Main Dark Green Circular Earth Disk */}
          <circle cx="100" cy="100" r="92" fill="#1C5B37" />

          {/* Curved Brown Soil Mound */}
          <path
            d="M 12 124 Q 100 86 188 124 A 92 92 0 0 1 12 124 Z"
            fill="#804D27"
          />

          {/* Plant Central White Stem */}
          <path
            d="M 100 134 L 100 82"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Left Leaf: Fresh Green */}
          <path
            d="M 100 90 C 82 85 64 68 64 56 C 80 52 96 70 100 90 Z"
            fill="#8FD18A"
          />

          {/* Right Leaf: Golden Ochre */}
          <path
            d="M 100 90 C 118 72 136 56 148 62 C 148 78 128 86 100 90 Z"
            fill="#E8B04A"
          />

          {/* Orbital Satellite Elliptical Dotted Path */}
          <ellipse
            cx="100"
            cy="104"
            rx="92"
            ry="40"
            transform="rotate(-23 100 104)"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeDasharray="7 6"
          />

          {/* Orbiting Satellite Yellow Dot */}
          <circle cx="184" cy="78" r="8.5" fill="#E8B04A" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Typography & Tagline */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          className="brand-logo__name"
          style={{
            fontFamily: 'var(--font-title)',
            fontWeight: 800,
            fontSize: size === 'sm' ? '1.18rem' : size === 'lg' ? '1.85rem' : '1.45rem',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: 'var(--clr-vert-semis)',
          }}
        >
          Semis<span style={{ color: 'var(--fg)' }}>Sûr</span>
        </div>

        {showTagline && (
          <div
            className="brand-logo__tagline"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: size === 'sm' ? '0.68rem' : size === 'lg' ? '0.85rem' : '0.74rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--fg-muted)',
              marginTop: '0.2rem',
              textTransform: 'none',
            }}
          >
            Prévenir. Constater. Réparer.
          </div>
        )}
      </div>
    </div>
  )
}
