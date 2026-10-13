import { useState, useEffect, useCallback } from "react";
import { extractResults } from "../../../services/api";
import {
  getAdminCandidates,
  updateAdminCandidate,
  deleteAdminCandidate,
} from "../../../services/adminService";
import { registerApi } from "../../../services/authService";
import "./Candidates.css";
import "../../../styles/adminForms.css";

const BLANK = { name: "", email: "", uni: "", major: "", year: "", status: "Active", skills: [] };

function normalizeCandidateRow(c) {
  const u = c.user || {};
  const fullName =
    [u.first_name, u.last_name].filter(Boolean).join(" ") ||
    u.username ||
    "Unnamed Candidate";
  const skillNames = Array.isArray(c.skills)
    ? c.skills.map((s) => (typeof s === "string" ? s : s?.skill_name || "")).filter(Boolean)
    : [];
  return {
    id: c.id,
    userId: u.id,
    name: fullName,
    email: u.email || "",
    uni: c.university || "",
    major: c.major || "",
    year: c.graduation_year ? String(c.graduation_year) : "",
    status: u.is_active === false ? "Suspended" : "Active",
    skills: skillNames,
  };
}

function Modal({ title, onClose, children }) {
  return (
    <div className="crud-overlay" onClick={onClose}>
      <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crud-modal-header">
          <h2>{title}</h2>
          <button type="button" className="crud-close" onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCandidates();
      const raw = extractResults(res);
      setCandidates(raw.map(normalizeCandidateRow));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load candidates from the database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      `${c.name} ${c.email} ${c.uni || ""} ${c.major || ""} ${(c.skills || []).join(" ")}`
        .toLowerCase()
        .includes(q)
    );
  });

  const openCreate = () => {
    setForm({ ...BLANK });
    setModal({});
  };

  const openEdit = (c) => {
    setForm({
      name: c.name,
      email: c.email,
      uni: c.uni || "",
      major: c.major || "",
      year: c.year || "",
      status: c.status || "Active",
      skills: c.skills ? [...c.skills] : [],
    });
    setModal(c);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const parts = String(form.name || "").trim().split(/\s+/).filter(Boolean);
      const first_name = parts[0] || "";
      const last_name = parts.slice(1).join(" ");
      const gradYear = form.year ? Number(form.year) : null;

      if (modal.id) {
        await updateAdminCandidate(modal.id, {
          first_name,
          last_name,
          email: form.email.trim(),
          university: form.uni,
          major: form.major,
          graduation_year: gradYear,
          is_active: form.status === "Active",
          skills: form.skills || [],
        });
      } else {
        const emailPrefix = (form.email || "cand")
          .split("@")[0]
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .toLowerCase();
        const username = `${emailPrefix}_${Math.floor(100 + Math.random() * 900)}`;
        const regRes = await registerApi({
          username,
          email: form.email.trim(),
          password: "CareerLens2026!Demo",
          first_name,
          last_name,
          role: "CANDIDATE",
          university: form.uni,
          major: form.major,
          graduation_year: gradYear,
        });
        const newUserId = regRes.data?.id;
        if (newUserId && (form.skills?.length > 0 || form.status === "Suspended")) {
          const allRes = await getAdminCandidates();
          const createdProfile = extractResults(allRes).find(
            (item) => Number(item.user?.id) === Number(newUserId)
          );
          if (createdProfile) {
            await updateAdminCandidate(createdProfile.id, {
              is_active: form.status === "Active",
              skills: form.skills || [],
            });
          }
        }
      }
      setModal(null);
      await loadCandidates();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to save candidate changes."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (c) => {
    try {
      await updateAdminCandidate(c.id, { is_active: c.status !== "Active" });
      await loadCandidates();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update candidate status.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminCandidate(deleteTarget.id);
      setDeleteTarget(null);
      await loadCandidates();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete candidate.");
      setDeleteTarget(null);
    }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Candidate Management</h1>
          <p>View and manage student accounts on the platform.</p>
        </div>
        <button className="workspace-button workspace-button-primary" onClick={openCreate}>
          + Add Candidate
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
          placeholder="Search by name, email, university..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="workspace-muted">
          {loading
            ? "Loading..."
            : `${filtered.length} candidate${filtered.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>University</th>
              <th>Major</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="workspace-empty">
                  Loading candidates from database...
                </td>
              </tr>
            ) : (
              <>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>{c.email || "—"}</td>
                    <td>{c.uni || "—"}</td>
                    <td>{c.major || "—"}</td>
                    <td>
                      <span
                        className={`workspace-status ${
                          c.status === "Active"
                            ? "workspace-status-success"
                            : "workspace-status-danger"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div className="workspace-table-actions">
                        <button
                          type="button"
                          className="workspace-button"
                          onClick={() => openEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="workspace-button"
                          onClick={() => toggleStatus(c)}
                        >
                          {c.status === "Active" ? "Suspend" : "Activate"}
                        </button>
                        <button
                          type="button"
                          className="workspace-button workspace-button-danger"
                          onClick={() => setDeleteTarget(c)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="workspace-empty">
                      No candidates found.
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
          title={modal.id ? "Edit Candidate" : "Add Candidate"}
          onClose={() => setModal(null)}
        >
          <CandidateForm
            form={form}
            setForm={setForm}
            onSubmit={handleSave}
            onCancel={() => setModal(null)}
            isEdit={!!modal.id}
            saving={saving}
            f={f}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "var(--color-text-secondary)" }}>
            Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
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

/* ─── Candidate Form ─── */
function CandidateForm({ form, setForm, onSubmit, onCancel, isEdit, f }) {
  const [skillInput, setSkillInput] = useState("");

  const skills = form.skills || [];

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    // Prevent duplicates (case-insensitive)
    if (skills.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      setSkillInput("");
      return;
    }
    setForm((prev) => ({ ...prev, skills: [...(prev.skills || []), trimmed] }));
    setSkillInput("");
  };

  const removeSkill = (idx) => {
    setForm((prev) => ({ ...prev, skills: (prev.skills || []).filter((_, i) => i !== idx) }));
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // prevent form submit
      addSkill();
    }
  };

  return (
    <form onSubmit={onSubmit} className="candidate-form">

      <p className="candidate-section-label">Basic Information</p>

      {/* Full Name */}
      <div className="candidate-field">
        <label className="candidate-label">
          Full Name <span className="candidate-required">*</span>
        </label>
        <input
          className="candidate-input"
          required
          value={form.name}
          onChange={f("name")}
          placeholder="e.g. John Smith"
        />
      </div>

      {/* Email */}
      <div className="candidate-field">
        <label className="candidate-label">
          Email <span className="candidate-required">*</span>
        </label>
        <input
          className="candidate-input"
          type="email"
          required
          value={form.email}
          onChange={f("email")}
          placeholder="e.g. john@example.com"
        />
      </div>

      {/* University & Major */}
      <div className="candidate-form-grid">
        <div className="candidate-field">
          <label className="candidate-label">University</label>
          <input
            className="candidate-input"
            value={form.uni}
            onChange={f("uni")}
            placeholder="e.g. Royal University of Phnom Penh"
          />
        </div>

        <div className="candidate-field">
          <label className="candidate-label">Major</label>
          <input
            className="candidate-input"
            value={form.major}
            onChange={f("major")}
            placeholder="e.g. Computer Science"
          />
        </div>
      </div>

      {/* Graduation Year & Status */}
      <div className="candidate-form-grid">
        <div className="candidate-field">
          <label className="candidate-label">Graduation Year</label>
          <input
            className="candidate-input candidate-input-narrow"
            value={form.year}
            onChange={f("year")}
            placeholder="e.g. 2026"
          />
        </div>

        <div className="candidate-field">
          <label className="candidate-label">Status</label>
          <select
            className="candidate-input candidate-select"
            value={form.status}
            onChange={f("status")}
          >
            <option>Active</option>
            <option>Suspended</option>
          </select>
        </div>
      </div>

      {/* Skills */}
      <div className="candidate-field">
        <label className="candidate-label">Skills</label>
        <div className="candidate-skill-row">
          <input
            className="candidate-input candidate-skill-input"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="Enter a skill..."
            maxLength={60}
          />
          <button
            type="button"
            className="candidate-skill-btn"
            onClick={addSkill}
            
          >
            Add Skill
          </button>
        </div>
        {skills.length > 0 && (
          <div className="candidate-chips">
            {skills.map((skill, idx) => (
              <span key={idx} className="candidate-chip">
                {skill}
                <button
                  type="button"
                  className="candidate-chip-remove"
                  onClick={() => removeSkill(idx)}
                  aria-label={`Remove ${skill}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="candidate-form-actions">
        <button type="button" className="workspace-button" onClick={onCancel}>Cancel</button>
        <button type="submit" className="workspace-button workspace-button-primary">
          {isEdit ? "Save Changes" : "Create Candidate"}
        </button>
      </div>
    </form>
  );
}
