import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import './HeaderQuickSearch.css';

/**
 * HeaderQuickSearch — Global centered search bar that fills header whitespace
 * and provides instant keyword search for jobs, candidates, or admin resources.
 */
export default function HeaderQuickSearch({ role = 'candidate' }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const placeholders = {
    candidate: t('header.searchCandidate', 'Search jobs, companies, skills...'),
    company: t('header.searchCompany', 'Search candidates, skills, applications...'),
    admin: t('header.searchAdmin', 'Quick search users, jobs, system logs...'),
  };

  const currentPlaceholder = placeholders[role] || placeholders.candidate;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (role === 'candidate') {
      navigate(`/candidate/jobs?q=${encodeURIComponent(trimmed)}`);
    } else if (role === 'company') {
      navigate(`/company/candidates?q=${encodeURIComponent(trimmed)}`);
    } else if (role === 'admin') {
      navigate(`/admin/users?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <form className="header-quick-search" onSubmit={handleSubmit} role="search">
      <Search size={16} className="header-quick-search__icon" />
      <input
        type="text"
        className="header-quick-search__input"
        placeholder={currentPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Global search"
      />
      <kbd className="header-quick-search__kbd">Ctrl K</kbd>
    </form>
  );
}
