import { useState } from "react";
import { readStore, saveDemoCollection } from '../../../services/member3DemoStore';
import './Skills.css';
import '../../../styles/adminForms.css';

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

function Skills() {
  const [store, setStore] = useState(() => readStore());
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const skills = store.skills || [];

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (!trimmed) return;

    if (!skills.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      const updated = [...skills, trimmed];
      saveDemoCollection("skills", updated);
      setStore((s) => ({ ...s, skills: updated }));
    }
    setModal(false);
    setNewSkill("");
  };

  const confirmDelete = () => {
    const updated = skills.filter((s) => s !== deleteTarget);
    saveDemoCollection("skills", updated);
    setStore((s) => ({ ...s, skills: updated }));
    setDeleteTarget(null);
  };

  const filtered = skills.filter((s) => s.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Global Skills List</h1>
          <p>Manage the predefined skills candidates and jobs can select.</p>
        </div>
        <button className="workspace-button workspace-button-primary" onClick={() => { setNewSkill(""); setModal(true); }}>
          + Add Skill
        </button>
      </div>

      <div className="workspace-toolbar">
        <input
          type="search"
          className="workspace-search"
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 0, width: 280 }}
        />
        <span className="workspace-muted">{filtered.length} skill{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Skill Name</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((skill) => (
              <tr key={skill}>
                <td><strong>{skill}</strong></td>
                <td style={{ textAlign: "right" }}>
                  <button
                    type="button"
                    className="workspace-button workspace-button-danger"
                    onClick={() => setDeleteTarget(skill)}
                    style={{ padding: "4px 8px", minHeight: "auto", fontSize: "11px" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="2" className="workspace-empty">No skills found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {modal && (
        <Modal title="Add New Skill" onClose={() => setModal(false)}>
          <form onSubmit={handleAdd} className="admin-form">
            <p className="admin-form-section">Skill Details</p>
            <div className="admin-field">
              <label className="admin-label">Skill Name <span className="admin-required">*</span></label>
              <input
                className="admin-input"
                required
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. React, Python, UI/UX"
                autoFocus
              />
            </div>
            <div className="admin-form-actions">
              <button type="button" className="workspace-button" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="workspace-button workspace-button-primary">Create Skill</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "#374151" }}>Delete <strong>{deleteTarget}</strong>? This cannot be undone.</p>
          <div className="workspace-actions">
            <button type="button" className="workspace-button workspace-button-danger" onClick={confirmDelete}>Yes, Delete</button>
            <button type="button" className="workspace-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </section>
  );
}

export default Skills;
