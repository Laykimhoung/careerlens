import { useState } from "react";
import UserTable from "../../components/admin/UserTable";
import { getDemoCollection, saveDemoCollection } from "../../services/member3DemoStore";
import "./Users.css";


function Users() {
  const [users, setUsers] = useState(() => getDemoCollection("users"));
  const [search, setSearch] = useState("");

  const updateUser = (user, changes) => {
    const nextUsers = users.map((item) => item.id === user.id ? { ...item, ...changes } : item);
    setUsers(nextUsers);
    saveDemoCollection("users", nextUsers);
  };

  const removeUser = (user) => {
    const nextUsers = users.filter((item) => item.id !== user.id);
    setUsers(nextUsers);
    saveDemoCollection("users", nextUsers);
  };

  return (
    <section className="workspace-page">
      <div className="demo-label">Demo data · Changes stay in this browser</div>
      <div className="workspace-heading">
        <div><h1>User management</h1><p>Review account access and platform roles.</p></div>
      </div>
      <UserTable
        users={users}
        search={search}
        onSearch={setSearch}
        onStatusChange={(user) => updateUser(user, { status: user.status === "Active" ? "Suspended" : "Active" })}
        onDelete={removeUser}
      />
    </section>
  );
}

export default Users;