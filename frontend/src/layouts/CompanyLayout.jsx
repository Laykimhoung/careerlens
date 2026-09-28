import { Outlet } from "react-router-dom";
import CompanySidebar from "../components/company/CompanySidebar";
import CompanyHeader from "../components/company/CompanyHeader";
export default function CompanyLayout() { return <div><CompanySidebar /><div><CompanyHeader /><main><Outlet /></main></div></div>; }