import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAuth } from '../../hooks/useAuth';
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
				<main className="admin-content">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
