import React from "react";
import { Menu } from "lucide-react";
import ThemeLanguageToggle from "../common/ThemeLanguageToggle";
import HeaderUserMenu from "../common/HeaderUserMenu";
import ModuleBackButton from "../common/ModuleBackButton";
import "./CompanyHeader.css";

export default function CompanyHeader({ onMenuClick }) {
  return (
    <header className="company-topbar">
      <div className="company-topbar-left">
        {onMenuClick && (
          <button
            type="button"
            className="company-menu-btn"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        )}
        <ModuleBackButton role="company" />
      </div>

      <div className="company-topbar-actions">
        <ThemeLanguageToggle />
        <HeaderUserMenu role="company" />
      </div>
    </header>
  );
}