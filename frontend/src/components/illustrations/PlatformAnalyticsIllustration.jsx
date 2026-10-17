import React from 'react';

/**
 * PlatformAnalyticsIllustration — Small recruitment badge illustration featuring an avatar,
 * star rating, and achievement ribbon inspired by the reference image's circular profile highlight.
 */
export default function PlatformAnalyticsIllustration({ className = '', style = {} }) {
  return (
    <div
      className={`platform-analytics-illustration ${className}`}
      style={{
        width: '64px',
        height: '64px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="avatarCircleBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EFF6FF" />
            <stop offset="100%" stopColor="#DBEAFE" />
          </linearGradient>

          <linearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Outer Circular Aura */}
        <circle cx="40" cy="40" r="38" fill="url(#avatarCircleBg)" stroke="#BFDBFE" strokeWidth="2" />

        {/* Candidate Avatar Character */}
        <g transform="translate(18, 14)">
          {/* Hair */}
          <path d="M14 10 Q22 2 30 10 Q31 16 29 20 Q22 24 15 20 Z" fill="#1E293B" />
          {/* Face */}
          <circle cx="22" cy="18" r="9" fill="#FED7AA" />
          {/* Shirt */}
          <path d="M10 40 L15 28 Q22 26 29 28 L34 40 Z" fill="#0284C7" />
          <polygon points="22,32 18,27 26,27" fill="#FFFFFF" />
        </g>

        {/* Gold Achievement Medal Pin on Bottom-Right */}
        <circle cx="56" cy="56" r="13" fill="url(#badgeGrad)" stroke="#FFFFFF" strokeWidth="2" />
        {/* Star Icon in Badge */}
        <polygon
          points="56,48 58.5,53 64,53.8 60,57.7 61,63 56,60.4 51,63 52,57.7 48,53.8 53.5,53"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
}
