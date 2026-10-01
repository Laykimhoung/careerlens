import React from "react";
import "./StatisticsCard.css";


export default function StatisticsCard({ label, value, icon, className = "" }) {
  return (
    <div className={`bg-white border border-[#e3e8e5] rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-2xl font-extrabold text-[#0f5a4a]">{value}</div>
          <div className="text-xs text-[#5b6b65] mt-1">{label}</div>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-[#eef4f1] text-[#0f5a4a] grid place-items-center font-bold">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
