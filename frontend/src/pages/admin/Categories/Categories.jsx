import { useState, useEffect, useCallback } from "react";
import { extractResults } from "../../../services/api";
import {
  getAdminJobs,
  getAdminCompanies,
} from "../../../services/adminService";
import "./Categories.css";
import "../../../styles/adminForms.css";

const CUSTOM_CATS_KEY = "careerlens_admin_custom_categories";

function loadCustomCategories() {
  try {
    const raw = localStorage.getItem(CUSTOM_CATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomCategories(list) {
  localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(list));
}

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
  const [categories, setCategories] = useState([]);
  const [jobCounts, setJobCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsRes, compsRes] = await Promise.all([
        getAdminJobs(),
        getAdminCompanies(),
      ]);
      const jobs = extractResults(jobsRes);
      const companies = extractResults(compsRes);

      const counts = {};
      const catSet = new Set(loadCustomCategories());

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

      setJobCounts(counts);
      setCategories(Array.from(catSet).sort());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newCat.trim();
    if (!trimmed) return;

    if (!categories.map((c) => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      const custom = loadCustomCategories();
      saveCustomCategories([...custom, trimmed]);
      setCategories((prev) => [...prev, trimmed].sort());
    }
    setModal(false);
    setNewCat("");
  };

  const confirmDelete = () => {
    const custom = loadCustomCategories().filter((c) => c !== deleteTarget);
    saveCustomCategories(custom);
    setCategories((prev) => prev.filter((c) => c !== deleteTarget));
    setDeleteTarget(null);
  };

  const filtered = categories.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Job Categories</h1>
          <p>Manage industry categories used across companies and job listings.</p>
        </div>
        <button
          className="workspace-button workspace-button-primary"
          onClick={() => {
            setNewCat("");
            setModal(true);
          }}
        >
          + Add Category
        </button>
      </div>

      <div className="workspace-toolbar">
        <input
          type="search"
          className="workspace-search"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="workspace-muted">
          {loading
            ? "Loading..."
            : `${filtered.length} categor${filtered.length !== 1 ? "ies" : "y"}`}
        </span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Category / Industry Name</th>
              <th>Active Jobs</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="workspace-empty">
                  Loading categories...
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
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="3" className="workspace-empty">
                      No categories found.
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
        <Modal title="Add New Category" onClose={() => setModal(false)}>
          <form onSubmit={handleAdd} className="admin-form">
            <p className="admin-form-section">Category Details</p>
            <div className="admin-field">
              <label className="admin-label">
                Category Name <span className="admin-required">*</span>
              </label>
              <input
                className="admin-input"
                required
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="e.g. Engineering, Marketing, Sales"
                autoFocus
              />
            </div>
            <div className="admin-form-actions">
              <button
                type="button"
                className="workspace-button"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="workspace-button workspace-button-primary"
              >
                Create Category
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "var(--color-text-secondary)" }}>
            Delete <strong>{deleteTarget}</strong>? This cannot be undone.
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

export default Categories;
