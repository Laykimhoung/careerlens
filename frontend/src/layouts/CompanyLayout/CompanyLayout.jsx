import { Outlet } from "react-router-dom";
import CompanySidebar from '../../components/company/CompanySidebar';
import CompanyHeader from '../../components/company/CompanyHeader';
import "./CompanyLayout.css";


export default function CompanyLayout() {
	return (
		<div className="company-shell">
			<CompanySidebar />
			<div className="company-main">
				<CompanyHeader />
				<main className="company-content"><Outlet /></main>
			</div>
		</div>
	);
}