import { useState } from "react";
import { readStore, saveDemoCollection } from '../../../services/member3DemoStore';
import './Categories.css';
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

function Categories() {
  const [store, setStore] = useState(() => readStore());
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categories = store.cats || [];

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newCat.trim();
    if (!trimmed) return;

    if (!categories.map((c) => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      const updated = [...categories, trimmed];
      saveDemoCollection("cats", updated);
      setStore((s) => ({ ...s, cats: updated }));
    }
    setModal(false);
    setNewCat("");
  };

  const confirmDelete = () => {
    const updated = categories.filter((c) => c !== deleteTarget);
    saveDemoCollection("cats", updated);
    setStore((s) => ({ ...s, cats: updated }));
    setDeleteTarget(null);
  };

  const filtered = categories.filter((c) => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Job Categories</h1>
          <p>Manage the predefined job categories used by companies.</p>
        </div>
        <button className="workspace-button workspace-button-primary" onClick={() => { setNewCat(""); setModal(true); }}>
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
          style={{ marginBottom: 0, width: 280 }}
        />
        <span className="workspace-muted">{filtered.length} categor{filtered.length !== 1 ? "ies" : "y"}</span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cat) => (
              <tr key={cat}>
                <td><strong>{cat}</strong></td>
                <td style={{ textAlign: "right" }}>
                  <button
                    type="button"
                    className="workspace-button workspace-button-danger"
                    onClick={() => setDeleteTarget(cat)}
                    style={{ padding: "4px 8px", minHeight: "auto", fontSize: "11px" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="2" className="workspace-empty">No categories found.</td></tr>
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
              <label className="admin-label">Category Name <span className="admin-required">*</span></label>
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
              <button type="button" className="workspace-button" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="workspace-button workspace-button-primary">Create Category</button>
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

export default Categories;
