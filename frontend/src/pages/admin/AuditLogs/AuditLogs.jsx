import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { extractResults } from "../../../services/api";
import { getAdminAuditLogs } from "../../../services/adminService";
import "./AuditLogs.css";

function AuditLogs() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAuditLogs();
      const raw = extractResults(res);
      setLogs(
        raw.map((l) => ({
          id: l.id,
          t: l.created_at
            ? String(l.created_at).replace("T", " ").slice(0, 16)
            : "—",
          actor: l.actor_username || "Admin",
          action: l.action || "EVENT",
          text:
            l.details ||
            `${l.action || "EVENT"} on ${l.target_type || "Record"} #${
              l.target_id || ""
            }`,
        }))
      );
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load audit logs from server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filtered = logs.filter((log) =>
    `${log.text} ${log.actor} ${log.action}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t("nav.auditLogs", "Audit Logs")}</h1>
          <p>{t("admin.auditLogsDesc", "A full history of system events and administrator actions.")}</p>
        </div>
        <span className="workspace-status">{logs.length} {t("admin.entries", "entries")}</span>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            background: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #FECACA",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <div className="workspace-toolbar">
        <input
          type="search"
          className="workspace-search"
          placeholder={t("admin.searchAuditLogs", "Search audit logs...")}
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
              <th style={{ width: "180px" }}>{t("admin.timestamp", "Timestamp")}</th>
              <th style={{ width: "150px" }}>{t("admin.actor", "Actor")}</th>
              <th>{t("admin.eventDescription", "Event Description")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="workspace-empty">
                  {t("admin.loadingAuditLogs", "Loading audit logs from database...")}
                </td>
              </tr>
            ) : (
              <>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td className="audit-timestamp">{log.t}</td>
                    <td>
                      <strong>{log.actor}</strong>
                    </td>
                    <td>{log.text}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="3" className="workspace-empty">
                      {t("admin.noAuditLogs", "No audit log entries found.")}
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AuditLogs;
