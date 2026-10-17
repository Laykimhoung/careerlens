import { Menu } from "lucide-react";
import ThemeLanguageToggle from "../common/ThemeLanguageToggle";
import "./CompanyHeader.css";

export default function CompanyHeader({ onMenuClick }) {
  return (
    <header className="company-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
      </div>
      <div className="company-topbar-actions">
        <ThemeLanguageToggle />
      </div>
    </header>
  );
}