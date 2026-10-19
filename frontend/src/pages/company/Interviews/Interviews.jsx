import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import InterviewCard from "../../../components/company/InterviewCard";
import Input from "../../../components/common/Input";
import Select from "../../../components/common/Select";
import Button from "../../../components/common/Button";
import {
  fetchNormalizedApplications,
  updateApplication,
} from "../../../services/applicationService";
import {
  fetchInterviewsList,
  createInterview,
  updateInterview,
} from "../../../services/interviewService";
import "./Interviews.css";

export default function Interviews() {
  const { t } = useLanguage();
  const [applicants, setApplicants] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [appList, intList] = await Promise.all([
        fetchNormalizedApplications(),
        fetchInterviewsList(),
      ]);
      setApplicants(appList);
      setInterviews(intList);
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to load interviews.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enrichedInterviews = useMemo(() => {
    const appMap = new Map(applicants.map((a) => [Number(a.id), a]));
    return interviews.map((iv) => {
      const app = appMap.get(Number(iv.application));
      const dt = iv.scheduled_at ? new Date(iv.scheduled_at) : null;
      const statusDisplay =
        iv.status === "SCHEDULED"
          ? "Scheduled"
          : iv.status === "COMPLETED"
          ? "Completed"
          : "Canceled";
      return {
        id: iv.id,
        appId: iv.application,
        candidate: app?.candidateName || `Applicant #${iv.application}`,
        role: app?.jobTitle || "Job Role",
        date: dt
          ? dt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "TBD",
        time: dt
          ? dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "",
        format: iv.location || (iv.meeting_link ? t("company.videoCall") : t("company.onSite")),
        meetingLink: iv.meeting_link || "",
        status: statusDisplay,
        rawStatus: iv.status,
      };
    });
  }, [interviews, applicants, t]);

  const handleScheduleInterview = async (event) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const appId = Number(form.get("appId"));
    const date = form.get("date");
    const time = form.get("time");
    const format = form.get("format") || "Video call";
    const meetingLink = (form.get("meeting_link") || "").trim();
    const location = (form.get("location") || format).trim();

    if (!appId || !date || !time) return;

    setSubmitting(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const isoDateTime = new Date(`${date}T${time}`).toISOString();
      const payload = {
        application: appId,
        scheduled_at: isoDateTime,
        location,
        meeting_link: meetingLink,
        status: "SCHEDULED",
      };
      await createInterview(payload);
      await updateApplication(appId, { status: "INTERVIEW" }).catch(() => {});
      await loadData();
      formEl.reset();
      setStatusMsg({
        type: "success",
        text: t("common.success"),
      });
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})?.[0] ||
        t("common.error");
      setStatusMsg({ type: "error", text: String(detail) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInterview = async (interview) => {
    try {
      await updateInterview(interview.id, { status: "CANCELED" });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || t("common.error"));
    }
  };

  const handleCompleteInterview = async (interview) => {
    try {
      await updateInterview(interview.id, { status: "COMPLETED" });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || t("common.error"));
    }
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t("company.interviewsTitle")}</h1>
          <p>{t("company.interviewsSub")}</p>
        </div>
      </div>

      {statusMsg.text && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            backgroundColor: statusMsg.type === "error" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
            color: statusMsg.type === "error" ? "#ef4444" : "#10b981",
            border: `1px solid ${statusMsg.type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
            fontSize: "14px",
          }}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="workspace-split">
        <section className="dashboard-panel">
          <h2>{t("company.scheduleNewInterview")}</h2>
          <form onSubmit={handleScheduleInterview}>
            <Select
              id="appId"
              name="appId"
              label={t("company.candidateApplicant")}
              required
              options={[
                { value: "", label: t("company.candidateApplicant") },
                ...applicants.map((app) => ({
                  value: String(app.id),
                  label: `${app.candidateName} · ${app.jobTitle}`,
                })),
              ]}
            />

            <div className="company-profile-grid">
              <Input
                id="date"
                name="date"
                type="date"
                label={t("company.interviewDate")}
                required
              />
              <Input
                id="time"
                name="time"
                type="time"
                label={t("company.interviewTime")}
                required
              />
            </div>

            <Select
              id="format"
              name="format"
              label={t("company.interviewFormat")}
              options={["Video call", "On-site", "Phone call"]}
            />

            <Input
              id="location"
              name="location"
              label={t("company.locationLabel")}
              placeholder="e.g. Phnom Penh HQ or Google Meet"
            />

            <Input
              id="meeting_link"
              name="meeting_link"
              type="url"
              label={t("company.meetingLink")}
              placeholder="https://meet.google.com/..."
            />

            <div
              className="workspace-actions"
              style={{ justifyContent: "flex-start", marginTop: "10px" }}
            >
              <Button type="submit" variant="primary" loading={submitting}>
                {t("company.scheduleInterviewBtn")}
              </Button>
            </div>
          </form>
        </section>

        <section className="dashboard-panel">
          <h2>{t("candidate.scheduledInterviews")}</h2>
          <div
            className="workspace-list"
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {loading ? (
              <p style={{ textAlign: "center", padding: "30px", color: "var(--color-text-secondary, #666)" }}>
                {t("common.loading")}
              </p>
            ) : enrichedInterviews.length > 0 ? (
              enrichedInterviews.map((interview) => (
                <InterviewCard
                  key={interview.id}
                  interview={interview}
                  onCancel={handleCancelInterview}
                  onComplete={handleCompleteInterview}
                />
              ))
            ) : (
              <p style={{ textAlign: "center", padding: "30px", color: "var(--color-text-secondary, #666)" }}>
                {t("company.noInterviews")}
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}