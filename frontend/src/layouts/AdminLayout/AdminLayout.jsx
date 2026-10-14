import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAuth } from '../../hooks/useAuth';
import ThemeLanguageToggle from "../../components/common/ThemeLanguageToggle";
import "./AdminLayout.css";

export default function AdminLayout() {
	const navigate = useNavigate();
	const { user, logout } = useAuth();
	const [menuOpen, setMenuOpen] = React.useState(false);
	const adminName = user?.name || user?.username || "Platform Admin";

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
					<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
						<button
							type="button"
							className="workspace-button admin-menu-button"
							onClick={() => setMenuOpen(true)}
							aria-label="Open navigation"
						>
							&#9776; Menu
						</button>
						<div>
							<h1 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>CareerLens Admin</h1>
							<p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-muted)" }}>Platform Operations</p>
						</div>
					</div>
					<div className="admin-header-actions">
						<ThemeLanguageToggle />
					</div>
				</header>
				<main className="admin-content">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
