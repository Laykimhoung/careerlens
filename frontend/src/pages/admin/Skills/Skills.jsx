import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { extractResults } from "../../../services/api";
import {
  getAdminSkills,
  createAdminSkill,
  deleteAdminSkill,
} from "../../../services/adminService";
import "./Skills.css";
import "../../../styles/adminForms.css";

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

function Skills() {
  const { t } = useLanguage();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminSkills();
      setSkills(extractResults(res));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load skills from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    setError(null);
    try {
      await createAdminSkill({ name: trimmed });
      setModal(false);
      setNewSkill("");
      await loadSkills();
    } catch (err) {
      setError(
        err.response?.data?.name?.[0] ||
          err.response?.data?.detail ||
          "Failed to create skill."
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    try {
      await deleteAdminSkill(deleteTarget.id);
      setDeleteTarget(null);
      await loadSkills();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete skill.");
      setDeleteTarget(null);
    }
  };

  const filtered = skills.filter((s) =>
    String(s.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t("admin.globalSkillsList", "Global Skills List")}</h1>
          <p>{t("admin.skillsDesc", "Manage the predefined skills candidates and jobs can select.")}</p>
        </div>
        <button
          className="workspace-button workspace-button-primary"
          onClick={() => {
            setNewSkill("");
            setModal(true);
          }}
        >
          {t("admin.addNewSkill", "+ Add Skill")}
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
          placeholder={t("admin.searchSkills", "Search skills...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="workspace-muted">
          {loading
            ? t("common.loading", "Loading...")
            : `${filtered.length} ${t("admin.entries", "entries")}`}
        </span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>{t("admin.skillName", "Skill Name")}</th>
              <th style={{ textAlign: "right" }}>{t("common.actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="2" className="workspace-empty">
                  {t("admin.loadingSkills", "Loading skills from database...")}
                </td>
              </tr>
            ) : (
              <>
                {filtered.map((skill) => (
                  <tr key={skill.id}>
                    <td>
                      <strong>{skill.name}</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="workspace-table-actions">
                        <button
                          type="button"
                          className="workspace-button workspace-button-danger"
                          onClick={() => setDeleteTarget(skill)}
                        >
                          {t("common.delete", "Delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="2" className="workspace-empty">
                      {t("admin.noSkills", "No skills found.")}
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {modal && (
        <Modal title={t("admin.addNewSkill", "Add New Skill")} onClose={() => setModal(false)}>
          <form onSubmit={handleAdd} className="admin-form">
            <p className="admin-form-section">{t("admin.skillDetails", "Skill Details")}</p>
            <div className="admin-field">
              <label className="admin-label">
                {t("admin.skillName", "Skill Name")} <span className="admin-required">*</span>
              </label>
              <input
                className="admin-input"
                required
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder={t("admin.skillPlaceholder", "e.g. React, Python, UI/UX")}
                autoFocus
              />
            </div>
            <div className="admin-form-actions">
              <button
                type="button"
                className="workspace-button"
                onClick={() => setModal(false)}
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="submit"
                className="workspace-button workspace-button-primary"
              >
                {t("admin.createSkill", "Create Skill")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal title={t("admin.confirmDelete", "Confirm Delete")} onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "var(--color-text-secondary)" }}>
            {t("admin.deleteSkillConfirm", "Are you sure you want to delete this skill?")} <strong>{deleteTarget.name}</strong>?
          </p>
          <div className="workspace-actions">
            <button
              type="button"
              className="workspace-button"
              onClick={() => setDeleteTarget(null)}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="button"
              className="workspace-button workspace-button-danger"
              onClick={confirmDelete}
            >
              {t("admin.yesDelete", "Yes, Delete")}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

export default Skills;
