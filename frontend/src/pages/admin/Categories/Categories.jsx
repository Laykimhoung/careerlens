import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { extractResults } from "../../../services/api";
import {
  getAdminJobs,
  getAdminCompanies,
  getAdminCategories,
  createAdminCategory,
  deleteAdminCategory,
} from "../../../services/adminService";
import "./Categories.css";
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

function Categories() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [jobCounts, setJobCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, compsRes, catsRes] = await Promise.all([
        getAdminJobs().catch(() => ({ data: [] })),
        getAdminCompanies().catch(() => ({ data: [] })),
        getAdminCategories().catch(() => ({ data: [] })),
      ]);
      const jobs = extractResults(jobsRes);
      const companies = extractResults(compsRes);
      const dbCategories = extractResults(catsRes);

      const counts = {};
      const catSet = new Set();
      const map = {};

      dbCategories.forEach((cat) => {
        if (cat.name) {
          catSet.add(cat.name);
          map[cat.name.toLowerCase()] = cat.id;
        }
      });

      companies.forEach((c) => {
        if (c.industry) catSet.add(c.industry);
      });
      jobs.forEach((j) => {
        const ind = j.company?.industry;
        if (ind) {
          catSet.add(ind);
          counts[ind] = (counts[ind] || 0) + 1;
        }
      });

      setCategoryMap(map);
      setJobCounts(counts);
      setCategories(Array.from(catSet).sort((a, b) => a.localeCompare(b)));
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load categories from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const trimmed = newCat.trim();
    if (!trimmed) return;
    setActionLoading(true);
    setError(null);

    try {
      if (!categories.map((c) => c.toLowerCase()).includes(trimmed.toLowerCase())) {
        await createAdminCategory({ name: trimmed });
      }
      setModal(false);
      setNewCat("");
      await loadCategories();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.name?.[0] || "Failed to create category in database.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    setError(null);

    try {
      const catId = categoryMap[deleteTarget.toLowerCase()];
      if (catId) {
        await deleteAdminCategory(catId);
      }
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to delete category from database.");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = categories.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t("admin.jobCategories", "Job Categories")}</h1>
          <p>{t("admin.jobCategoriesDesc", "Manage industry categories used across companies and job listings.")}</p>
        </div>
        <button
          className="workspace-button workspace-button-primary"
          onClick={() => {
            setNewCat("");
            setModal(true);
          }}
        >
          {t("admin.addNewCategory", "+ Add Category")}
        </button>
      </div>

      {error && (
        <div className="admin-alert-banner admin-alert-error" style={{ marginBottom: "16px" }}>
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}>✕</button>
        </div>
      )}

      <div className="workspace-toolbar">
        <input
          type="search"
          className="workspace-search"
          placeholder={t("admin.searchCategories", "Search categories...")}
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
              <th>{t("admin.categoryIndustryName", "Category / Industry Name")}</th>
              <th>{t("admin.activeJobs", "Active Jobs")}</th>
              <th style={{ textAlign: "right" }}>{t("common.actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="workspace-empty">
                  {t("admin.loadingCategories", "Loading categories...")}
                </td>
              </tr>
            ) : (
              <>
                {filtered.map((cat) => (
                  <tr key={cat}>
                    <td>
                      <strong>{cat}</strong>
                    </td>
                    <td>{jobCounts[cat] || 0}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="workspace-table-actions">
                        <button
                          type="button"
                          className="workspace-button workspace-button-danger"
                          onClick={() => setDeleteTarget(cat)}
                        >
                          {t("common.delete", "Delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="3" className="workspace-empty">
                      {t("admin.noCategories", "No categories found.")}
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
        <Modal title={t("admin.addNewCategory", "Add New Category")} onClose={() => setModal(false)}>
          <form onSubmit={handleAdd} className="admin-form">
            <p className="admin-form-section">{t("admin.categoryDetails", "Category Details")}</p>
            <div className="admin-field">
              <label className="admin-label">
                {t("admin.categoryName", "Category Name")} <span className="admin-required">*</span>
              </label>
              <input
                className="admin-input"
                required
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder={t("admin.categoryPlaceholder", "e.g. Fintech, Healthcare, AI & ML")}
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
                disabled={actionLoading}
              >
                {actionLoading ? t("common.saving", "Saving...") : t("admin.createCategory", "Create Category")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal title={t("admin.confirmDelete", "Confirm Delete")} onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "var(--color-text-secondary)" }}>
            {t("admin.deleteCategoryConfirm", "Are you sure you want to delete this category?")} <strong>{deleteTarget}</strong>?
          </p>
          <div className="workspace-actions">
            <button
              type="button"
              className="workspace-button"
              disabled={actionLoading}
              onClick={() => setDeleteTarget(null)}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="button"
              className="workspace-button workspace-button-danger"
              disabled={actionLoading}
              onClick={confirmDelete}
            >
              {actionLoading ? t("common.deleting", "Deleting...") : t("admin.yesDelete", "Yes, Delete")}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

export default Categories;
