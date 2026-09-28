import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";
export default function AdminLayout() { return <div><AdminSidebar /><div><AdminHeader /><main><Outlet /></main></div></div>; }