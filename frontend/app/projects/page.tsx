"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../auth/AuthContext";
import ProjectTable from "../components/project/ProjectTable";

const NAV = [
  { label: "Calendar", href: "/" },
  { label: "Projects", href: "/projects" },
];

export default function ProjectsPage() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">

      {/* ── Header ── */}
      <header className="h-16 shrink-0 flex items-center px-4 gap-6 border-b border-gray-200">

        {/* Logo */}
        <div className="w-48 shrink-0 flex items-center gap-2">
          <span className="text-xl font-semibold text-gray-900 tracking-wide select-none">SWTS</span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-1.5 rounded text-sm font-medium transition ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        {/* New Project button */}
        <button
          className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          + New Project
        </button>

        {/* User avatar */}
        <button
          onClick={logout}
          title={`Signed in as ${user?.name ?? ""}\nClick to sign out`}
          className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center select-none cursor-pointer hover:bg-blue-700 transition"
        >
          {user?.name?.[0]?.toUpperCase() ?? "?"}
        </button>
      </header>

      {/* ── Page title bar ── */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Projects</h1>
        <span className="text-xs text-gray-400">All projects</span>
      </div>

      {/* ── Table ── */}
      <main className="flex-1 overflow-auto px-6 py-4">
        <ProjectTable />
      </main>

    </div>
  );
}
