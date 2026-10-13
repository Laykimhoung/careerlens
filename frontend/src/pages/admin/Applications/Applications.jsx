import { useState, useEffect, useCallback } from "react";
import api, { extractResults } from "../../../services/api";
import {
  getAdminApplications,
  getAdminCandidates,
  getAdminJobs,
  updateAdminApplication,
  deleteAdminApplication,
} from "../../../services/adminService";
import {
  normalizeApplicationRecord,
  toBackendApplicationStatus,
  createApplicationNote,
} from "../../../services/applicationService";
import "./Applications.css";
import "../../../styles/adminForms.css";

const STATUS_FLOW = [
  "Applied",
  "Reviewing",
  "Interviewing",
  "Offered",
  "Rejected",
];
const BLANK_APP = { jid: "", sid: "", status: "Applied", notes: "" };

function Modal({ title, onClose, children }) {
  return (
    <div className="crud-overlay" onClick={onClose}>
      <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crud-modal-header">
          <h2>{title}</h2>
          <button type="button" className="crud-close" onClick={onClose}>
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK_APP);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appsRes, candsRes, jobsRes] = await Promise.all([
        getAdminApplications(),
        getAdminCandidates(),
        getAdminJobs(),
      ]);
      const rawApps = extractResults(appsRes);
      const rawCands = extractResults(candsRes);
      const rawJobs = extractResults(jobsRes);

      setCandidates(
        rawCands.map((c) => ({
          id: c.id,
          name:
            [c.user?.first_name, c.user?.last_name].filter(Boolean).join(" ") ||
            c.user?.username ||
            `Candidate #${c.id}`,
        }))
      );
      setJobs(
        rawJobs.map((j) => ({
          id: j.id,
          title: j.title,
          co: j.company?.company_name || "Unknown Company",
        }))
      );
      setApps(
        rawApps.map((a) => {
          const norm = normalizeApplicationRecord(a);
          return {
            ...norm,
            studentName: norm.candidateName,
            date: norm.appliedAt,
            jid: norm.jobId,
            sid: norm.candidateId,
          };
        })
      );
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load applications from server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const display = apps.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${a.studentName} ${a.jobTitle} ${a.companyName}`
        .toLowerCase()
        .includes(q);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setForm({
      ...BLANK_APP,
      sid: candidates[0] ? String(candidates[0].id) : "",
      jid: jobs[0] ? String(jobs[0].id) : "",
    });
    setModal({});
  };

  const openEdit = (a) => {
    setForm({
      jid: String(a.jid || ""),
      sid: String(a.sid || ""),
      status: a.status,
      notes: "",
    });
    setModal(a);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const backendStatus = toBackendApplicationStatus(form.status);
      if (modal.id) {
        await updateAdminApplication(modal.id, { status: backendStatus });
        if (form.notes?.trim()) {
          await createApplicationNote({
            application: modal.id,
            note: form.notes.trim(),
          });
        }
      } else {
        const createdRes = await api.post("/applications/", {
          job_id: Number(form.jid),
          candidate_id: Number(form.sid),
          status: backendStatus,
        });
        if (form.notes?.trim() && createdRes.data?.id) {
          await createApplicationNote({
            application: createdRes.data.id,
            note: form.notes.trim(),
          });
        }
      }
      setModal(null);
      await loadData();
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Failed to save application.";
      setError(detail);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id, status) => {
    setError(null);
    try {
      await updateAdminApplication(id, {
        status: toBackendApplicationStatus(status),
      });
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to update application status."
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminApplication(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete application.");
      setDeleteTarget(null);
    }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>All Applications</h1>
          <p>Monitor and manage every application across the platform.</p>
        </div>
        <button
          className="workspace-button workspace-button-primary"
          onClick={openCreate}
        >
          + Add Application
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            background: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #FECACA",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <div className="workspace-toolbar">
        <input
          type="search"
          className="workspace-search"
          placeholder="Search by candidate or job..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="apps-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {STATUS_FLOW.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="workspace-muted">
          {loading
            ? "Loading..."
            : `${display.length} application${display.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Job</th>
              <th>Company</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="workspace-empty">
                  Loading applications from database...
                </td>
              </tr>
            ) : (
              <>
                {display.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.studentName}</strong>
                    </td>
                    <td>{a.jobTitle}</td>
                    <td>{a.companyName}</td>
                    <td>
                      <select
                        className="apps-status-select"
                        value={a.status}
                        onChange={(e) => changeStatus(a.id, e.target.value)}
                      >
                        {STATUS_FLOW.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td
                      style={{
                        color: "var(--color-text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.date || "—"}
                    </td>
                    <td>
                      <div className="workspace-table-actions">
                        <button
                          type="button"
                          className="workspace-button"
                          onClick={() => openEdit(a)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="workspace-button workspace-button-danger"
                          onClick={() => setDeleteTarget(a)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {display.length === 0 && (
                  <tr>
                    <td colSpan="6" className="workspace-empty">
                      No applications found.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal
          title={modal.id ? "Edit Application" : "Add Application"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSave} className="admin-form">
            <p className="admin-form-section">Application Details</p>

            <div className="admin-field">
              <label className="admin-label">
                Candidate <span className="admin-required">*</span>
              </label>
              <select
                className="admin-input admin-select"
                required
                disabled={!!modal.id}
                value={form.sid}
                onChange={f("sid")}
              >
                <option value="">Select candidate...</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label className="admin-label">
                Job <span className="admin-required">*</span>
              </label>
              <select
                className="admin-input admin-select"
                required
                disabled={!!modal.id}
                value={form.jid}
                onChange={f("jid")}
              >
                <option value="">Select job...</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.co}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label className="admin-label">Status</label>
              <select
                className="admin-input admin-select"
                value={form.status}
                onChange={f("status")}
              >
                {STATUS_FLOW.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label className="admin-label">Reviewer Note (Optional)</label>
              <textarea
                className="admin-input admin-textarea"
                value={form.notes}
                onChange={f("notes")}
                placeholder="Optional note to attach to this application..."
              />
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="workspace-button"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="workspace-button workspace-button-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : modal.id
                  ? "Save Changes"
                  : "Create Application"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "var(--color-text-secondary)" }}>
            Delete application by <strong>{deleteTarget.studentName}</strong> for{" "}
            <strong>{deleteTarget.jobTitle}</strong>?
          </p>
          <div className="workspace-actions">
            <button
              type="button"
              className="workspace-button"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="workspace-button workspace-button-danger"
              onClick={confirmDelete}
            >
              Yes, Delete
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
