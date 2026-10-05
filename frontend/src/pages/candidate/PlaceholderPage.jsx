// PlaceholderPage.jsx is a simple React component that displays a placeholder message for pages that are under construction or not yet available. It accepts a `title` prop to customize the heading of the placeholder.
export default function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: "40px", textAlign: "center", backgroundColor: "#fff", borderRadius: "8px", border: "1px dashed #d1d5db" }}>
      <h2 style={{ fontSize: "24px", color: "#111827", marginBottom: "12px" }}>{title}</h2>
      <p style={{ color: "#6b7280" }}>This page is coming soon. Stay tuned!</p>
    </div>
  );
}
