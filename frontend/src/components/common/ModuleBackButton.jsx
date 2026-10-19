import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import './ModuleBackButton.css';

/**
 * ModuleBackButton — Displays "Welcome to CareerLens" on the root dashboard,
 * and dynamically switches to a smart "Back to ....." navigation control
 * across all other modules and subpages.
 */
export default function ModuleBackButton({ role = 'candidate' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const path = location.pathname.replace(/\/$/, '');

  const isRootDashboard =
    path === '/candidate' ||
    path === '/company' ||
    path === '/admin';

  // If on the root dashboard of the role, show the welcome greeting
  if (isRootDashboard) {
    return (
      <div className="header-dashboard-welcome" aria-label="Welcome to CareerLens">
        <span className="header-dashboard-welcome__prefix">
          {t('common.welcomeTo', 'Welcome to')}
        </span>
        <span className="header-dashboard-welcome__brand">CareerLens</span>
      </div>
    );
  }

  // Determine destination and localized label
  const getBackInfo = () => {
    // ── Candidate routes ──
    if (path.startsWith('/candidate/jobs/')) {
      return {
        to: '/candidate/jobs',
        label: t('candidate.backToJobs', 'Back to Jobs'),
      };
    }
    if (path.startsWith('/candidate/applications/')) {
      return {
        to: '/candidate/applications',
        label: t('candidate.backToApplications', 'Back to Applications'),
      };
    }
    if (path.startsWith('/candidate')) {
      return {
        to: '/candidate',
        label: t('common.backToDashboard', 'Back to Dashboard'),
      };
    }

    // ── Company routes ──
    if (path.startsWith('/company/jobs/create') || path.match(/\/company\/jobs\/\d+/)) {
      return {
        to: '/company/jobs',
        label: t('company.backToJobs', 'Back to Jobs'),
      };
    }
    if (path.startsWith('/company/candidates/')) {
      return {
        to: '/company/candidates',
        label: t('company.backToCandidates', 'Back to Candidates'),
      };
    }
    if (path.startsWith('/company')) {
      return {
        to: '/company',
        label: t('common.backToDashboard', 'Back to Dashboard'),
      };
    }

    // ── Admin routes ──
    if (path.startsWith('/admin')) {
      return {
        to: '/admin',
        label: t('common.backToDashboard', 'Back to Dashboard'),
      };
    }

    return {
      to: -1,
      label: t('common.back', 'Back'),
    };
  };

  const backInfo = getBackInfo();

  const handleNavigate = () => {
    if (backInfo.to === -1) {
      navigate(-1);
    } else {
      navigate(backInfo.to);
    }
  };

  return (
    <button
      type="button"
      className="module-back-btn"
      onClick={handleNavigate}
      title={backInfo.label}
      aria-label={backInfo.label}
    >
      <ArrowLeft size={16} className="module-back-btn__arrow" />
      <span className="module-back-btn__label">{backInfo.label}</span>
    </button>
  );
}
