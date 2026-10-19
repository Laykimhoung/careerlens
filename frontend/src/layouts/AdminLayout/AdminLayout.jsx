import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from "../../context/LanguageContext";
import ThemeLanguageToggle from "../../components/common/ThemeLanguageToggle";
import HeaderUserMenu from "../../components/common/HeaderUserMenu";
import ModuleBackButton from "../../components/common/ModuleBackButton";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const adminName = user?.name || user?.username || t("platformAdmin", "Platform Admin");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      <AdminSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        adminName={adminName}
        onLogout={handleLogout}
      />
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <ModuleBackButton role="admin" />
          </div>

          <div className="admin-header-actions">
            <ThemeLanguageToggle />
            <HeaderUserMenu role="admin" />
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
