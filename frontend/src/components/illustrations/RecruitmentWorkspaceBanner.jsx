import React from 'react';
import recruitmentBannerImg from '../../assets/images/recruitmentWorkspaceBanner.png';

/**
 * RecruitmentWorkspaceBanner — Full-size isometric recruitment banner
 * with edge-to-edge coverage and lively bouncing motion.
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        ...style,
      }}
      aria-label="CareerLens Recruitment Hub"
    >
      <style>{`
        @keyframes bannerIsometricBounce {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.02);
          }
        }
        .banner-isometric-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          border-radius: 16px;
          animation: bannerIsometricBounce 4s ease-in-out infinite;
          transition: transform 0.3s ease;
        }
        .workspace-banner-illustration:hover .banner-isometric-image {
          transform: translateY(-8px) scale(1.035);
        }
      `}</style>
      <img
        src={recruitmentBannerImg}
        alt="CareerLens Recruitment Platform"
        className="banner-isometric-image"
      />
    </div>
  );
}
