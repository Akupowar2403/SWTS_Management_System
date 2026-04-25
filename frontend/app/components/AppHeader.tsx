"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../auth/AuthContext";

const NAV = [
  { label: "Calendar", href: "/" },
  { label: "Projects", href: "/projects" },
];

export default function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="h-16 shrink-0 flex items-center px-6 gap-6 border-b border-gray-200 bg-white">

      {/* Logo */}
      <span className="text-xl font-semibold text-gray-900 tracking-wide select-none w-32">
        SWTS
      </span>

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

      {/* User avatar + logout */}
      <button
        onClick={logout}
        title={`Signed in as ${user?.name ?? ""}\nClick to sign out`}
        className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center select-none cursor-pointer hover:bg-blue-700 transition"
      >
        {user?.name?.[0]?.toUpperCase() ?? "?"}
      </button>
    </header>
  );
}
