import React from 'react';

/**
 * CandidateCareerSpotlight — High-quality SVG illustration inspired by the reference image's
 * feature card (showing a character in a warm office/studio setting with credentials and badge).
 */
export default function CandidateCareerSpotlight({ className = '', style = {} }) {
  return (
    <div
      className={`career-spotlight-illustration ${className}`}
      style={{
        width: '100%',
        maxWidth: '220px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 240 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <linearGradient id="spotlightBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF7ED" />
            <stop offset="100%" stopColor="#FFEDD5" />
          </linearGradient>

          <linearGradient id="shirtGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#042F2E" />
          </linearGradient>

          <linearGradient id="chairGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Ambient Rounded Background Badge */}
        <rect x="15" y="10" width="210" height="180" rx="18" fill="url(#spotlightBg)" />

        {/* Floating Verified Achievement Certificate */}
        <g transform="translate(30, 24)">
          <rect width="36" height="46" rx="4" fill="#FFFFFF" stroke="#FDBA74" strokeWidth="1.5" />
          <rect x="7" y="10" width="22" height="4" rx="2" fill="#F97316" />
          <rect x="7" y="18" width="16" height="3" rx="1.5" fill="#CBD5E1" />
          <rect x="7" y="24" width="18" height="3" rx="1.5" fill="#CBD5E1" />
          <circle cx="18" cy="34" r="5" fill="#FBBF24" />
        </g>

        {/* Modern Office Chair Backrest */}
        <path d="M72 135 L70 80 Q70 65 85 65 L155 65 Q170 65 170 80 L168 135 Z" fill="url(#chairGrad)" />

        {/* Professional Character Sitting */}
        {/* Head & Neck */}
        <rect x="115" y="65" width="10" height="16" rx="2" fill="#FDBA74" />
        <ellipse cx="120" cy="52" rx="18" ry="20" fill="#FED7AA" />

        {/* Hair and Beard */}
        <path d="M102 46 Q120 28 138 46 Q139 56 137 62 Q130 76 120 76 Q110 76 103 62 Z" fill="#78350F" />
        <ellipse cx="120" cy="52" rx="14" ry="16" fill="#FED7AA" />
        <path d="M106 50 Q118 36 134 50" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
        {/* Modern Beard & Smile */}
        <path d="M110 58 Q120 74 130 58 Q131 66 120 68 Q109 66 110 58 Z" fill="#78350F" />
        <path d="M116 57 Q120 60 124 57" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" />

        {/* Torso / Collared Shirt */}
        <path d="M88 120 L96 82 Q100 80 120 80 Q140 80 144 82 L152 120 Z" fill="url(#shirtGrad)" />
        {/* Collar Details */}
        <polygon points="120,88 112,80 128,80" fill="#FFFFFF" />
        <line x1="120" y1="88" x2="120" y2="120" stroke="#042F2E" strokeWidth="1.5" />

        {/* Crossed Arms / Hands on Desk */}
        <ellipse cx="120" cy="122" rx="35" ry="10" fill="#0D9488" />
        <rect x="105" y="117" width="30" height="9" rx="4" fill="#FED7AA" />

        {/* Modern Clean Desk */}
        <rect x="35" y="126" width="170" height="12" rx="3" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />

        {/* Minimalist Laptop & Coffee Cup */}
        <rect x="80" y="116" width="40" height="11" rx="2" fill="#E2E8F0" />
        <rect x="95" y="118" width="10" height="2" rx="1" fill="#0284C7" />
        <circle cx="160" cy="124" r="6" fill="#EA580C" />
      </svg>
    </div>
  );
}
