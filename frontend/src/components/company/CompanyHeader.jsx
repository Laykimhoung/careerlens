import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import ThemeLanguageToggle from "../common/ThemeLanguageToggle";
import "./CompanyHeader.css";

export default function CompanyHeader() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const companyName = user?.company_name || user?.full_name || user?.username || "Company";

  return (
    <header className="company-topbar">
      <div className="company-topbar-info">
        <strong>{companyName}</strong>
        <small>{t("company.recruitmentWorkspace")}</small>
      </div>
      <div className="company-topbar-actions">
        <ThemeLanguageToggle />
        <span className="workspace-status workspace-status-warning">{t("company.workspaceDemoLabel")}</span>
      </div>
    </header>
  );
}