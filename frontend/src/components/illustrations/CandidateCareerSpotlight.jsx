import React from 'react';
import candidateSpotlightImg from '../../assets/images/candidateCareerSpotlight.png';

/**
 * CandidateCareerSpotlight — Full-sized character illustration with smooth bouncing motion.
 * Clean transparent background with no restricting yellow container.
 */
export default function CandidateCareerSpotlight({ className = '', style = {} }) {
  return (
    <div
      className={`career-spotlight-illustration-wrap ${className}`}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'visible',
        ...style,
      }}
      aria-label="Career Candidate Spotlight"
    >
      <style>{`
        @keyframes spotlightCharacterBounce {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-8px) scale(1.02);
          }
        }
        .spotlight-character-img {
          width: 100%;
          height: auto;
          max-height: 220px;
          object-fit: contain;
          object-position: center;
          display: block;
          animation: spotlightCharacterBounce 3.6s ease-in-out infinite;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .career-spotlight-illustration-wrap:hover .spotlight-character-img {
          transform: translateY(-11px) scale(1.04);
        }
      `}</style>

      <img
        src={candidateSpotlightImg}
        alt="Candidate Working at Desk"
        className="spotlight-character-img"
      />
    </div>
  );
}
