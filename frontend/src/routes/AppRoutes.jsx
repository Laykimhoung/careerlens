import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import CandidateLayout from "../layouts/CandidateLayout";
import CompanyLayout from "../layouts/CompanyLayout";
import AdminLayout from "../layouts/AdminLayout";

import Home from "../pages/landing/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

import CandidateDashboard from "../pages/candidate/Dashboard";
import CandidateProfile from "../pages/candidate/Profile";
import CandidateResume from "../pages/candidate/Resume";
import CandidateJobs from "../pages/candidate/Jobs";
import CandidateJobDetails from "../pages/candidate/JobDetails";
import CandidateApplications from "../pages/candidate/Applications";
import CandidateApplicationDetails from "../pages/candidate/ApplicationDetails";
import CandidateSavedJobs from "../pages/candidate/SavedJobs";

import CompanyDashboard from "../pages/company/Dashboard";
import CompanyProfile from "../pages/company/Profile";
import CompanyJobs from "../pages/company/Jobs";
import CompanyCreateJob from "../pages/company/CreateJob";
import CompanyEditJob from "../pages/company/EditJob";
import CompanyApplicants from "../pages/company/Applicants";
import CompanyApplicantDetails from "../pages/company/ApplicantDetails";
import CompanyInterviews from "../pages/company/Interviews";

import AdminDashboard from "../pages/admin/Dashboard";
import AdminUsers from "../pages/admin/Users";
import AdminCompanies from "../pages/admin/Companies";
import AdminCandidates from "../pages/admin/Candidates";
import AdminJobs from "../pages/admin/Jobs";
import AdminVerification from "../pages/admin/Verification";
import AdminApplications from "../pages/admin/Applications";
import AdminReports from "../pages/admin/Reports";
import AdminCategories from "../pages/admin/Categories";
import AdminSkills from "../pages/admin/Skills";
import AdminAuditLogs from "../pages/admin/AuditLogs";
import AdminNotifications from "../pages/admin/Notifications";
import AdminSettings from "../pages/admin/Settings";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route
          path="/candidate"
          element={
            <ProtectedRoute role="candidate">
              <CandidateLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CandidateDashboard />} />
          <Route path="profile" element={<CandidateProfile />} />
          <Route path="resume" element={<CandidateResume />} />
          <Route path="jobs" element={<CandidateJobs />} />
          <Route path="jobs/:id" element={<CandidateJobDetails />} />
          <Route path="applications" element={<CandidateApplications />} />
          <Route path="applications/:id" element={<CandidateApplicationDetails />} />
          <Route path="saved-jobs" element={<CandidateSavedJobs />} />
        </Route>

        <Route path="/company" element={<CompanyLayout />}>
          <Route index element={<CompanyDashboard />} />
          <Route path="profile" element={<CompanyProfile />} />
          <Route path="jobs" element={<CompanyJobs />} />
          <Route path="jobs/create" element={<CompanyCreateJob />} />
          <Route path="jobs/:id/edit" element={<CompanyEditJob />} />
          <Route path="applicants" element={<CompanyApplicants />} />
          <Route path="applicants/:id" element={<CompanyApplicantDetails />} />
          <Route path="interviews" element={<CompanyInterviews />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="candidates" element={<AdminCandidates />} />
          <Route path="companies" element={<AdminCompanies />} />
          <Route path="verification" element={<AdminVerification />} />
          <Route path="jobs" element={<AdminJobs />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="skills" element={<AdminSkills />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
