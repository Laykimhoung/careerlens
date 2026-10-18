import React from "react";
import "./StatisticsCard.css";

export default function StatisticsCard({ label, value, icon, className = "" }) {
  return (
    <div className={`stats-card-box ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="stats-card-val">{value}</div>
          <div className="stats-card-lbl">{label}</div>
        </div>
        {icon && (
          <div className="stats-card-icon">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
