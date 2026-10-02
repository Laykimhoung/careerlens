import "./AdminHeader.css";

export default function AdminHeader({ adminName = "Platform Admin", onMenuClick, onLogout }) {
  return (
    <header className="admin-header">
      <div>
        <button className="workspace-button admin-menu-button" type="button" onClick={onMenuClick} aria-label="Open navigation">Menu</button>
        <h1>Administration</h1>
        <p>Platform operations</p>
      </div>
      <div className="admin-header-actions">
        <span className="workspace-muted">{adminName}</span>
        <button className="workspace-button" type="button" onClick={onLogout}>Log out</button>
      </div>
    </header>
  );
}