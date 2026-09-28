import { Outlet } from "react-router-dom";
import CandidateSidebar from "../components/candidate/CandidateSidebar";
import CandidateHeader from "../components/candidate/CandidateHeader";
export default function CandidateLayout() { return <div><CandidateSidebar /><div><CandidateHeader /><main><Outlet /></main></div></div>; }