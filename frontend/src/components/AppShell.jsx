import React from "react";
import SidebarNav from "./SidebarNav";
import ThemeToggle from "./ThemeToggle";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import Logo from "../assets/nextstep-logo.png";

export default function AppShell({ children }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Mobile top bar (light/dark aware) */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 backdrop-blur-sm md:hidden
                      dark:border-slate-700 dark:bg-slate-900/90">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 hover:bg-slate-50 focus-ring
                     dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800"
          aria-label="Open navigation"
        >
          <Bars3Icon className="h-4 w-4" />
          Menu
        </button>
<div className="flex items-center gap-2">
  <img src={Logo} alt="NextStep logo" className="h-10 w-10 rounded-lg object-contain" />
  <span className="text-sm font-semibold">NextStep</span>
</div>
        <ThemeToggle />
      </div>

      <div className="mx-auto flex w-full max-w-7xl">
        {/* Desktop sidebar */}
        <SidebarNav variant="desktop" />

        {/* Mobile drawer */}
        <div className={`fixed inset-0 z-40 md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
            onClick={() => setOpen(false)}
          />
          <div
            className={`absolute left-0 top-0 h-full w-72 transform border-r border-slate-200 bg-white p-3 shadow-lg transition-transform
                        dark:border-slate-700 dark:bg-slate-900 ${open ? "translate-x-0" : "-translate-x-full"}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-2 flex h-10 items-center justify-between px-1">
              <div className="text-sm font-semibold">Navigation</div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 bg-white p-1 hover:bg-slate-50 focus-ring
                           dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800"
                aria-label="Close navigation"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <SidebarNav variant="mobile" onNavigate={() => setOpen(false)} />
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1">
         
          

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
