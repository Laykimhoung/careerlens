import React from "react";
import ThemeLanguageToggle from "../common/ThemeLanguageToggle";
import HeaderUserMenu from "../common/HeaderUserMenu";
import ModuleBackButton from "../common/ModuleBackButton";
import "./CandidateHeader.css";

export default function CandidateHeader({ onMenuClick }) {
  return (
    <header className="header">
      <div className="header__left">
        <button
          type="button"
          className="header__menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "24px", height: "24px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <ModuleBackButton role="candidate" />
      </div>

      <div className="header__right">
        <ThemeLanguageToggle />
        <HeaderUserMenu role="candidate" />
      </div>
    </header>
  );
}