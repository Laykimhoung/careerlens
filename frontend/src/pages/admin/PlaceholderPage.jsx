export default function PlaceholderPage({ title }) {
  return (
    <div className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{title}</h1>
          <p>This module is currently under development.</p>
        </div>
      </div>
      <div className="workspace-panel workspace-empty">
        <p>The {title?.toLowerCase()} module will be available soon.</p>
      </div>
    </div>
  );
}
