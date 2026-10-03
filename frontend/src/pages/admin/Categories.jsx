import { useState } from "react";
import { readStore, saveDemoCollection } from "../../services/member3DemoStore";
import "./Categories.css";

function Categories() {
  const [store, setStore] = useState(() => readStore());
  const [newCat, setNewCat] = useState("");

  const categories = store.cats || [];

  const handleAdd = (e) => {
    e.preventDefault();
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      const updated = [...categories, newCat.trim()];
      saveDemoCollection("cats", updated);
      setStore((s) => ({ ...s, cats: updated }));
      setNewCat("");
    }
  };

  const handleDelete = (cat) => {
    const updated = categories.filter((c) => c !== cat);
    saveDemoCollection("cats", updated);
    setStore((s) => ({ ...s, cats: updated }));
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Job Categories</h1>
          <p>Manage the predefined job categories used by companies.</p>
        </div>
      </div>

      <div className="workspace-panel">
        <form className="workspace-toolbar" onSubmit={handleAdd}>
          <input
            type="text"
            className="workspace-search"
            placeholder="New category name..."
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            style={{ marginBottom: 0, width: "300px" }}
          />
          <button type="submit" className="workspace-button workspace-button-primary">
            Add Category
          </button>
        </form>

        <div className="workspace-table-wrap mt-4">
          <table className="workspace-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat}>
                  <td><strong>{cat}</strong></td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="workspace-button workspace-button-danger"
                      onClick={() => handleDelete(cat)}
                      style={{ padding: "4px 8px", minHeight: "auto", fontSize: "11px" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="2" className="workspace-empty">No categories defined.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Categories;
