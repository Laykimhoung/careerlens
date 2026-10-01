import React from "react";
import "./CandidateTable.css";


function CandidateTable({
  candidates = [],
  onView,
  onStatusChange,
  onDelete,
}) {
  return (
    <div className="bg-white border border-[#e3e8e5] rounded-xl overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>University</th>
            <th>Major</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id}>
              <td className="font-semibold">{candidate.name}</td>
              <td>{candidate.email}</td>
              <td>{candidate.uni || "—"}</td>
              <td>{candidate.major || "—"}</td>
              <td>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  candidate.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {candidate.status}
                </span>
              </td>
              <td>
                <div className="flex justify-end gap-1">
                  <button className="px-2.5 py-1.5 rounded border text-xs" onClick={() => onView?.(candidate)}>
                    View
                  </button>
                  <button className="px-2.5 py-1.5 rounded border text-xs" onClick={() => onStatusChange?.(candidate)}>
                    {candidate.status === "Active" ? "Suspend" : "Activate"}
                  </button>
                  <button className="px-2.5 py-1.5 rounded bg-red-600 text-white text-xs" onClick={() => onDelete?.(candidate)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export default CandidateTable;
