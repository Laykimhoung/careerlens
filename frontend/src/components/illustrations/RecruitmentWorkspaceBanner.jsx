import React from 'react';

/**
 * RecruitmentWorkspaceBanner — High-quality SVG illustration inspired by the reference image's
 * right-hand scenic banner. Depicts a modern career hub & recruitment campus with warm sunlight,
 * lush greenery, and contemporary architecture.
 */
export default function RecruitmentWorkspaceBanner({ className = '', style = {} }) {
  return (
    <div
      className={`workspace-banner-illustration ${className}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '190px',
        maxHeight: '230px',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '16px',
        background: 'linear-gradient(180deg, #F97316 0%, #FB923C 35%, #FED7AA 70%, #FEF3C7 100%)',
        ...style,
      }}
      aria-label="CareerLens Recruitment Campus Banner"
    >
      <svg
        viewBox="0 0 500 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="40%" stopColor="#FB923C" />
            <stop offset="75%" stopColor="#FDBA74" />
            <stop offset="100%" stopColor="#FEF08A" />
          </linearGradient>

          <linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FDE047" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="bldgGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          <linearGradient id="roofGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>

          <linearGradient id="awningGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>

          <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Sky Background */}
        <rect width="500" height="280" fill="url(#skyGrad)" />

        {/* Ambient Sun Glow */}
        <circle cx="430" cy="50" r="60" fill="url(#sunGrad)" />
        <circle cx="430" cy="50" r="35" fill="#FEF9C3" fillOpacity="0.8" />

        {/* Background City Silhouettes */}
        <rect x="20" y="70" width="45" height="150" rx="3" fill="#C2410C" fillOpacity="0.25" />
        <rect x="75" y="50" width="55" height="170" rx="4" fill="#C2410C" fillOpacity="0.3" />
        <rect x="140" y="85" width="40" height="135" rx="3" fill="#C2410C" fillOpacity="0.2" />

        {/* Palm Tree in Background */}
        <path d="M455 210 Q452 140 445 90" stroke="#78350F" strokeWidth="4.5" strokeLinecap="round" />
        {/* Palm Fronds */}
        <path d="M445 90 Q410 75 390 95" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
        <path d="M445 90 Q435 60 415 65" stroke="#16A34A" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M445 90 Q465 60 480 75" stroke="#15803D" strokeWidth="4" strokeLinecap="round" />
        <path d="M445 90 Q485 85 495 105" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />

        {/* Streetlight on Right */}
        <path d="M420 215 L420 40 Q420 30 410 30 L400 30" stroke="#1E293B" strokeWidth="3" fill="none" />
        <polygon points="392,34 408,34 404,28 396,28" fill="#0F172A" />
        <ellipse cx="400" cy="35" rx="4" ry="2" fill="#FEF08A" />

        {/* Side Building Left */}
        <rect x="10" y="110" width="110" height="110" fill="#E2E8F0" />
        <rect x="25" y="125" width="30" height="40" rx="3" fill="url(#glassGrad)" />
        <rect x="70" y="125" width="30" height="40" rx="3" fill="url(#glassGrad)" />
        <rect x="25" y="180" width="30" height="40" rx="3" fill="url(#glassGrad)" />
        <rect x="70" y="180" width="30" height="40" rx="3" fill="url(#glassGrad)" />

        {/* Main Career Center Hub Building */}
        <rect x="140" y="115" width="230" height="105" rx="4" fill="url(#bldgGrad1)" stroke="#CBD5E1" strokeWidth="1" />
        {/* Modern Accent Roof Fascia */}
        <rect x="135" y="105" width="240" height="12" rx="3" fill="url(#roofGrad)" />
        {/* Striped Storefront Awning */}
        <path d="M160 145 L270 145 L260 160 L150 160 Z" fill="url(#awningGrad)" />
        {/* Awning Stripes */}
        <polygon points="160,145 180,145 170,160 150,160" fill="#EA580C" />
        <polygon points="200,145 220,145 210,160 190,160" fill="#EA580C" />
        <polygon points="240,145 260,145 250,160 230,160" fill="#EA580C" />

        {/* Door and Windows */}
        <rect x="175" y="165" width="30" height="55" rx="2" fill="#334155" />
        <rect x="180" y="170" width="9" height="22" rx="1" fill="#93C5FD" fillOpacity="0.8" />
        <rect x="191" y="170" width="9" height="22" rx="1" fill="#93C5FD" fillOpacity="0.8" />
        <circle cx="201" cy="195" r="1.5" fill="#F8FAFC" />

        {/* Large Display Window */}
        <rect x="220" y="160" width="80" height="60" rx="2" fill="url(#glassGrad)" />
        {/* CareerLens Logo Emblem on Window */}
        <circle cx="260" cy="190" r="14" fill="#0284C7" />
        <path d="M254 186 L266 186 M260 180 L260 192 M254 195 Q260 200 266 195" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

        {/* Promotional Banner Outside */}
        <rect x="315" y="180" width="18" height="38" rx="2" fill="#F97316" />
        <text x="324" y="202" fill="#FFFFFF" fontSize="9" fontWeight="800" textAnchor="middle">HIRING</text>

        {/* Paved Walkway & Ground */}
        <rect x="0" y="220" width="500" height="60" fill="#E2E8F0" />
        <rect x="0" y="220" width="500" height="6" fill="#CBD5E1" />
        {/* Pavement Pavers */}
        <line x1="60" y1="226" x2="60" y2="280" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="140" y1="226" x2="140" y2="280" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="230" y1="226" x2="230" y2="280" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="330" y1="226" x2="330" y2="280" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="420" y1="226" x2="420" y2="280" stroke="#CBD5E1" strokeWidth="1" />

        {/* Professional Walking Figure (Candidate Heading to Career Hub) */}
        <g transform="translate(245, 160)">
          {/* Head */}
          <circle cx="15" cy="10" r="6" fill="#FBCFE8" />
          <path d="M12 6 Q16 4 19 8" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          {/* Torso / Shirt */}
          <rect x="9" y="17" width="12" height="22" rx="3" fill="#15803D" />
          {/* Backpack */}
          <rect x="5" y="20" width="6" height="14" rx="2" fill="#0284C7" />
          {/* Trousers */}
          <path d="M11 39 L7 62" stroke="#1E293B" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M19 39 L23 60" stroke="#1E293B" strokeWidth="4.5" strokeLinecap="round" />
          {/* Shoes */}
          <ellipse cx="6" cy="63" rx="4" ry="2" fill="#0F172A" />
          <ellipse cx="24" cy="61" rx="4" ry="2" fill="#0F172A" />
        </g>
      </svg>
    </div>
  );
}
