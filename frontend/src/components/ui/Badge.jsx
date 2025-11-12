import React from "react";

export default function Badge({ color = "emerald", children, className = "" }) {
  const colorMap = {
    emerald: "bg-emerald-500/15 text-emerald-300",
    indigo: "bg-indigo-500/15 text-indigo-300",
    sky: "bg-sky-500/15 text-sky-300",
    slate: "bg-slate-500/15 text-slate-300",
  };
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${colorMap[color]} ${className}`}>
      {children}
    </span>
  );
}
