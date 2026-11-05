import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Loading from "../components/common/Loading";

import MainLayout from "../layouts/MainLayout/MainLayout";
import CandidateLayout from "../layouts/CandidateLayout/CandidateLayout";
import CompanyLayout from "../layouts/CompanyLayout/CompanyLayout";
import AdminLayout from "../layouts/AdminLayout/AdminLayout";

// Safe dynamic lazy import that auto-recovers from missing chunks after new deployments
function safeLazy(importFn) {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      const pageKey = "chunk_retry_" + window.location.pathname;
      if (!sessionStorage.getItem(pageKey)) {
        sessionStorage.setItem(pageKey, "1");
        window.location.reload();
        return;
      }
      sessionStorage.removeItem(pageKey);
      throw error;
    }
  });
}

// Landing & Auth Pages (Lazy Loaded)
const Home = safeLazy(() => import("../pages/landing/Home/Home"));
const AuthPage = safeLazy(() => import("../pages/auth/AuthPage/AuthPage"));
const ForgotPassword = safeLazy(() => import("../pages/auth/ForgotPassword/ForgotPassword"));
const ResetPassword = safeLazy(() => import("../pages/auth/ResetPassword/ResetPassword"));

// Candidate Pages (Lazy Loaded)
const CandidateDashboard = safeLazy(() => import("../pages/candidate/Dashboard/Dashboard"));
const CandidateProfile = safeLazy(() => import("../pages/candidate/Profile/Profile"));
const CandidateResume = safeLazy(() => import("../pages/candidate/Resume/Resume"));
const CandidateCVStudio = safeLazy(() => import("../pages/candidate/CVStudio/CVStudio"));
const CandidateCVVersions = safeLazy(() => import("../pages/candidate/CVVersions/CVVersions"));
const CandidateCareerRoadmap = safeLazy(() => import("../pages/candidate/CareerRoadmap/CareerRoadmap"));
const CandidateBestFitJobs = safeLazy(() => import("../pages/candidate/BestFitJobs/BestFitJobs"));
const CandidateJobs = safeLazy(() => import("../pages/candidate/Jobs/Jobs"));
const CandidateJobDetails = safeLazy(() => import("../pages/candidate/JobDetails/JobDetails"));
const CandidateApplications = safeLazy(() => import("../pages/candidate/Applications/Applications"));
const CandidateApplicationDetails = safeLazy(() => import("../pages/candidate/ApplicationDetails/ApplicationDetails"));
const CandidateSavedJobs = safeLazy(() => import("../pages/candidate/SavedJobs/SavedJobs"));
const CandidateMessages = safeLazy(() => import("../pages/candidate/Messages/Messages"));
const CandidatePlaceholder = safeLazy(() => import("../pages/candidate/PlaceholderPage"));

// Company Pages (Lazy Loaded)
const CompanyDashboard = safeLazy(() => import("../pages/company/Dashboard/Dashboard"));
const CompanyProfile = safeLazy(() => import("../pages/company/Profile/Profile"));
const CompanyJobs = safeLazy(() => import("../pages/company/Jobs/Jobs"));
const CompanyCreateJob = safeLazy(() => import("../pages/company/CreateJob/CreateJob"));
const CompanyEditJob = safeLazy(() => import("../pages/company/EditJob/EditJob"));
const CompanyApplicants = safeLazy(() => import("../pages/company/Applicants/Applicants"));
const CompanyApplicantDetails = safeLazy(() => import("../pages/company/ApplicantDetails/ApplicantDetails"));
const CompanyInterviews = safeLazy(() => import("../pages/company/Interviews/Interviews"));

// Admin Pages (Lazy Loaded)
const AdminDashboard = safeLazy(() => import("../pages/admin/Dashboard/Dashboard"));
const AdminUsers = safeLazy(() => import("../pages/admin/Users/Users"));
const AdminCompanies = safeLazy(() => import("../pages/admin/Companies/Companies"));
const AdminCandidates = safeLazy(() => import("../pages/admin/Candidates/Candidates"));
const AdminJobs = safeLazy(() => import("../pages/admin/Jobs/Jobs"));
const AdminVerification = safeLazy(() => import("../pages/admin/Verification/Verification"));
const AdminApplications = safeLazy(() => import("../pages/admin/Applications/Applications"));
const AdminReports = safeLazy(() => import("../pages/admin/Reports/Reports"));
const AdminCategories = safeLazy(() => import("../pages/admin/Categories/Categories"));
const AdminSkills = safeLazy(() => import("../pages/admin/Skills/Skills"));
const AdminAuditLogs = safeLazy(() => import("../pages/admin/AuditLogs/AuditLogs"));
const AdminNotifications = safeLazy(() => import("../pages/admin/Notifications/Notifications"));
const AdminSettings = safeLazy(() => import("../pages/admin/Settings/Settings"));

// 404 Page (Lazy Loaded)
const NotFound = safeLazy(() => import("../pages/common/NotFound/NotFound"));

function PublicJobRedirect() {
  const { id } = useParams();
  return <Navigate to={`/candidate/jobs/${id}`} replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading message="Loading..." size="lg" />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
          </Route>

          {/* Public alias forwarding directly to candidate job detail view */}
          <Route path="/jobs/:id" element={<PublicJobRedirect />} />

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
            <Route path="cv-studio" element={<CandidateCVStudio />} />
            <Route path="cv-versions" element={<CandidateCVVersions />} />
            <Route path="career-roadmap" element={<CandidateCareerRoadmap />} />
            <Route path="best-fit-jobs" element={<CandidateBestFitJobs />} />
            <Route path="jobs" element={<CandidateJobs />} />
            <Route path="jobs/:id" element={<CandidateJobDetails />} />
            <Route path="applications" element={<CandidateApplications />} />
            <Route path="applications/:id" element={<CandidateApplicationDetails />} />
            <Route path="saved-jobs" element={<CandidateSavedJobs />} />
            <Route path="interviews" element={<CandidatePlaceholder title="Interviews" />} />
            <Route path="messages" element={<CandidateMessages />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<CandidatePlaceholder title="Settings" />} />
          </Route>

          <Route
            path="/company"
            element={
              <ProtectedRoute role="company">
                <CompanyLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CompanyDashboard />} />
            <Route path="profile" element={<CompanyProfile />} />
            <Route path="jobs" element={<CompanyJobs />} />
            <Route path="jobs/create" element={<CompanyCreateJob />} />
            <Route path="jobs/:id/edit" element={<CompanyEditJob />} />
            <Route path="applicants" element={<CompanyApplicants />} />
            <Route path="applicants/:id" element={<CompanyApplicantDetails />} />
            <Route path="candidate-ranking" element={<Navigate to="/company/applicants" replace />} />
            <Route path="interviews" element={<CompanyInterviews />} />
            <Route path="messages" element={<CandidateMessages />} />
            <Route path="talent-pool" element={<CandidatePlaceholder title="Talent Pool" />} />
            <Route path="reports" element={<CandidatePlaceholder title="Reports" />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<CandidatePlaceholder title="Settings" />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
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

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
