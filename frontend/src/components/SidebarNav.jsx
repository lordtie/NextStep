import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  CalendarDaysIcon,
  HomeIcon,
  ListBulletIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import Logo from "../assets/nextstep-logo.png"; // <-- add your logo here

const LINKS = [
  { label: "Dashboard", icon: HomeIcon, to: "/dashboard" },
  { label: "Tasks", icon: ListBulletIcon, to: "/tasks" },
  { label: "Calendar", icon: CalendarDaysIcon, to: "/calendar" },
  { label: "Settings", icon: Cog6ToothIcon, to: "/settings" },
];

export default function SidebarNav({ variant = "desktop", className = "", onNavigate }) {
  const { user, logout } = useAuth();

  const baseWrapper =
    variant === "desktop"
      ? "hidden md:flex md:w-64 md:flex-col"
      : "flex w-72 flex-col";

  return (
    <aside
      className={`${baseWrapper} ${className}
                  border-r border-slate-200 bg-white
                  dark:border-slate-700 dark:bg-slate-900/80`}
    >
      <div className="flex h-16 items-center gap-3 px-4">
        {/* Logo replaces the old blue rounded square */}
        <img
          src={Logo}
          alt="NextStep logo"
          className="h-12 w-12 rounded-xl object-contain"
          draggable={false}
        />
        <div className="text-lg font-semibold tracking-tight">NextStep</div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => onNavigate && onNavigate()}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium",
                isActive
                  ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200 dark:bg-slate-800/70 dark:text-white dark:ring-0"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5 text-slate-400 group-[.active]:text-sky-700 group-hover:text-slate-600 dark:text-slate-400 dark:group-[.active]:text-white" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-4 pt-2 space-y-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700
                        dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          <div className="font-medium">{user?.name || user?.email}</div>
          <div className="text-slate-500 dark:text-slate-400">{user?.email}</div>
        </div>
        <button
          onClick={async () => { await logout(); onNavigate && onNavigate(); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100
                     dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
