import { useState } from "react";
import { readStore, saveDemoCollection } from '../../../services/member3DemoStore';
import './Candidates.css';

const BLANK = { name: "", email: "", uni: "", major: "", year: "", status: "Active", skills: [] };

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
  const [store, setStore] = useState(() => readStore());
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const users = store.users || [];
  const candidates = users.filter((u) => u.role === "student" || u.role === "candidate");

  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase();
    return !q || `${c.name} ${c.email} ${c.uni || ""} ${c.major || ""}`.toLowerCase().includes(q);
  });

  const saveUsers = (next) => { saveDemoCollection("users", next); setStore((s) => ({ ...s, users: next })); };

  const openCreate = () => { setForm({ ...BLANK }); setModal({}); };
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

  const handleSave = (e) => {
    e.preventDefault();
    if (modal.id) {
      saveUsers(users.map((u) => u.id === modal.id ? { ...u, ...form } : u));
    } else {
      const uid = "s" + Date.now().toString(36);
      saveUsers([...users, { id: uid, role: "student", pw: "demo123", ...form }]);
    }
    setModal(null);
  };

  const toggleStatus = (c) => saveUsers(users.map((u) => u.id === c.id ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" } : u));
  const confirmDelete = () => { saveUsers(users.filter((u) => u.id !== deleteTarget.id)); setDeleteTarget(null); };
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Candidate Management</h1>
          <p>View and manage student accounts on the platform.</p>
        </div>
        <button className="workspace-button workspace-button-primary" onClick={openCreate}>+ Add Candidate</button>
      </div>

      <div className="workspace-toolbar">
        <input
          type="search"
          className="workspace-search"
          placeholder="Search by name, email, university..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 0, width: 320 }}
        />
        <span className="workspace-muted">{filtered.length} candidate{filtered.length !== 1 ? "s" : ""}</span>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.email}</td>
                <td>{c.uni || "—"}</td>
                <td>{c.major || "—"}</td>
                <td>
                  <span className={`workspace-status ${c.status === "Active" ? "workspace-status-success" : "workspace-status-danger"}`}>
                    {c.status}
                  </span>
                </td>
                <td>
                  <div className="workspace-table-actions">
                    <button type="button" className="workspace-button" onClick={() => openEdit(c)}>Edit</button>
                    <button type="button" className="workspace-button" onClick={() => toggleStatus(c)}>
                      {c.status === "Active" ? "Suspend" : "Activate"}
                    </button>
                    <button type="button" className="workspace-button workspace-button-danger" onClick={() => setDeleteTarget(c)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" className="workspace-empty">No candidates found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal title={modal.id ? "Edit Candidate" : "Add Candidate"} onClose={() => setModal(null)}>
          <CandidateForm
            form={form}
            setForm={setForm}
            onSubmit={handleSave}
            onCancel={() => setModal(null)}
            isEdit={!!modal.id}
            f={f}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "#374151" }}>
            Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
          </p>
          <div className="workspace-actions">
            <button type="button" className="workspace-button workspace-button-danger" onClick={confirmDelete}>Yes, Delete</button>
            <button type="button" className="workspace-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
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

      {/* University */}
      <div className="candidate-field">
        <label className="candidate-label">University</label>
        <input
          className="candidate-input"
          value={form.uni}
          onChange={f("uni")}
          placeholder="e.g. Royal University of Phnom Penh"
        />
      </div>

      {/* Major */}
      <div className="candidate-field">
        <label className="candidate-label">Major</label>
        <input
          className="candidate-input"
          value={form.major}
          onChange={f("major")}
          placeholder="e.g. Computer Science"
        />
      </div>

      {/* Graduation Year */}
      <div className="candidate-field">
        <label className="candidate-label">Graduation Year</label>
        <input
          className="candidate-input candidate-input-narrow"
          value={form.year}
          onChange={f("year")}
          placeholder="e.g. 2026"
        />
      </div>

      {/* Status */}
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
