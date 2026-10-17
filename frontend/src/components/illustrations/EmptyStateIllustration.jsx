import React from 'react';

/**
 * EmptyStateIllustration — Clean, friendly vector illustration for empty lists or zero-data states
 * (no applications yet, no jobs posted yet).
 */
export default function EmptyStateIllustration({
  type = 'search',
  className = '',
  style = {},
}) {
  return (
    <div
      className={`empty-state-illustration ${className}`}
      style={{
        width: '120px',
        height: '100px',
        margin: '0 auto 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 160 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="folderBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EFF6FF" />
            <stop offset="100%" stopColor="#DBEAFE" />
          </linearGradient>

          <linearGradient id="lensGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Ambient Floating Documents */}
        <rect x="25" y="30" width="70" height="85" rx="6" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1.5" transform="rotate(-6 25 30)" />
        <rect x="55" y="20" width="75" height="90" rx="6" fill="url(#folderBg)" stroke="#BFDBFE" strokeWidth="1.5" />

        {/* Document Skeleton Content Lines */}
        <rect x="68" y="36" width="34" height="5" rx="2" fill="#93C5FD" />
        <rect x="68" y="47" width="48" height="4" rx="2" fill="#CBD5E1" />
        <rect x="68" y="56" width="40" height="4" rx="2" fill="#CBD5E1" />
        <rect x="68" y="65" width="44" height="4" rx="2" fill="#CBD5E1" />

        {/* Floating Magnifying Glass / Career Lens */}
        <circle cx="106" cy="74" r="22" fill="#FFFFFF" fillOpacity="0.85" stroke="url(#lensGrad)" strokeWidth="4" />
        <line x1="122" y1="90" x2="140" y2="108" stroke="#0284C7" strokeWidth="5.5" strokeLinecap="round" />

        {/* Sparkle Accent */}
        <path d="M125 30 Q128 36 134 38 Q128 40 125 46 Q123 40 117 38 Q123 36 125 30 Z" fill="#F59E0B" />
        <circle cx="40" cy="80" r="3" fill="#38BDF8" />
      </svg>
    </div>
  );
}
