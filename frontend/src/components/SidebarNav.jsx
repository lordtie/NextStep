// frontend/src/components/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const active =
    "block rounded-md px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700";
  const inactive =
    "block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    // NOTE: no `hidden md:block` here → shows on mobile too (this is what made it duplicate)
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 h-screen">
      <div className="flex h-full flex-col">
        {/* Title */}
        <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">NextStep</div>
        </div>

        {/* Simple nav list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            <Item to="/" label="Dashboard" activeClass={active} inactiveClass={inactive} />
            <Item to="/tasks" label="Tasks" activeClass={active} inactiveClass={inactive} />
            <Item to="/calendar" label="Calendar" activeClass={active} inactiveClass={inactive} />
            <Item to="/notes" label="Notes" activeClass={active} inactiveClass={inactive} />
            <Item to="/settings" label="Settings" activeClass={active} inactiveClass={inactive} />
          </div>
        </nav>

        {/* Footer: tiny user line + logout */}
        <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800">
          <div className="mb-2 truncate text-xs text-slate-500 dark:text-slate-400">
            {user?.name || "Signed in"}{user?.email ? ` · ${user.email}` : ""}
          </div>
          <button
            onClick={async () => {
              try { await logout(); } finally { navigate("/login", { replace: true }); }
            }}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:translate-y-[1px] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

function Item({ to, label, activeClass, inactiveClass }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
    >
      {label}
    </NavLink>
  );
}
