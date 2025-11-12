import React from "react";

export default function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm
                  dark:border-slate-700 dark:bg-slate-800/70 dark:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}
