import "./UserTable.css";

export default function UserTable({
  users = [],
  search = "",
  onSearch,
  onEdit,
  onStatusChange,
  onDelete,
}) {
  const query = search.toLowerCase();
  const filtered = users.filter(
    (user) => !query || `${user.name} ${user.email}`.toLowerCase().includes(query)
  );

  return (
    <div>
      <input
        className="workspace-search"
        type="search"
        placeholder="Search users"
        value={search}
        onChange={(e) => onSearch?.(e.target.value)}
      />

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td className="font-semibold">{user.name}</td>
                <td>{user.email}</td>
                <td className="capitalize">{user.role}</td>
                <td>
                      <span className={`workspace-status ${user.status === "Active" ? "workspace-status-success" : "workspace-status-warning"}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  {user.role !== "admin" && (
                    <div className="workspace-table-actions">
                      {onEdit && <button type="button" onClick={() => onEdit(user)}>Edit</button>}
                      <button type="button" onClick={() => onStatusChange?.(user)}>
                        {user.status === "Active" ? "Suspend" : "Activate"}
                      </button>
                      <button type="button" onClick={() => onDelete?.(user)}>
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" className="workspace-empty">No users match this search.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
