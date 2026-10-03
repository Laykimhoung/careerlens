import { useState } from "react";
import { readStore, saveDemoCollection } from "../../services/member3DemoStore";
import "./Skills.css";

function Skills() {
  const [store, setStore] = useState(() => readStore());
  const [newSkill, setNewSkill] = useState("");
  const [search, setSearch] = useState("");

  const skills = store.skills || [];

  const handleAdd = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updated = [...skills, newSkill.trim()];
      saveDemoCollection("skills", updated);
      setStore((s) => ({ ...s, skills: updated }));
      setNewSkill("");
    }
  };

  const handleDelete = (skill) => {
    const updated = skills.filter((s) => s !== skill);
    saveDemoCollection("skills", updated);
    setStore((s) => ({ ...s, skills: updated }));
  };

  const filtered = skills.filter((s) => s.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Global Skills List</h1>
          <p>Manage the predefined skills candidates and jobs can select.</p>
        </div>
        <span className="workspace-status">{skills.length} skills total</span>
      </div>

      <div className="workspace-panel">
        <div className="skills-actions">
          <form className="workspace-toolbar flex-grow" onSubmit={handleAdd}>
            <input
              type="text"
              className="workspace-search flex-grow"
              placeholder="New skill name..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              style={{ marginBottom: 0, maxWidth: "none" }}
            />
            <button type="submit" className="workspace-button workspace-button-primary">
              Add Skill
            </button>
          </form>

          <input
            type="search"
            className="workspace-search"
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 0, width: "250px" }}
          />
        </div>

        <div className="workspace-table-wrap mt-4">
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
                      onClick={() => handleDelete(skill)}
                      style={{ padding: "4px 8px", minHeight: "auto", fontSize: "11px" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="2" className="workspace-empty">No skills found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Skills;
