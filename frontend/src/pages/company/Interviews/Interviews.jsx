import { useState, useEffect, useCallback, useMemo } from "react";
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
        format: iv.location || (iv.meeting_link ? "Video call" : "On-site"),
        meetingLink: iv.meeting_link || "",
        status: statusDisplay,
        rawStatus: iv.status,
      };
    });
  }, [interviews, applicants]);

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
        text: "Interview scheduled and candidate notified.",
      });
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})?.[0] ||
        "Failed to schedule interview.";
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
      alert(err.response?.data?.detail || "Failed to cancel interview.");
    }
  };

  const handleCompleteInterview = async (interview) => {
    try {
      await updateInterview(interview.id, { status: "COMPLETED" });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update interview status.");
    }
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Interviews</h1>
          <p>Coordinate candidate conversations and interview times.</p>
        </div>
      </div>

      {statusMsg.text && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            backgroundColor: statusMsg.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: statusMsg.type === "error" ? "#b91c1c" : "#15803d",
            fontSize: "14px",
          }}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="workspace-split">
        <section className="dashboard-panel">
          <h2>Schedule an interview</h2>
          <form onSubmit={handleScheduleInterview}>
            <Select
              id="appId"
              name="appId"
              label="Candidate"
              required
              options={[
                { value: "", label: "Select a candidate" },
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
                label="Date"
                required
              />
              <Input
                id="time"
                name="time"
                type="time"
                label="Time"
                required
              />
            </div>

            <Select
              id="format"
              name="format"
              label="Format"
              options={["Video call", "On-site", "Phone call"]}
            />

            <Input
              id="location"
              name="location"
              label="Location / Room (optional)"
              placeholder="e.g. Phnom Penh HQ or Google Meet"
            />

            <Input
              id="meeting_link"
              name="meeting_link"
              type="url"
              label="Video Meeting URL (optional)"
              placeholder="https://meet.google.com/..."
            />

            <div
              className="workspace-actions"
              style={{ justifyContent: "flex-start", marginTop: "10px" }}
            >
              <Button type="submit" variant="primary" loading={submitting}>
                Schedule interview
              </Button>
            </div>
          </form>
        </section>

        <section className="dashboard-panel">
          <h2>Interview schedule</h2>
          <div
            className="workspace-list"
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {loading ? (
              <p style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                Loading scheduled interviews...
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
              <p style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                No interviews have been scheduled.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}