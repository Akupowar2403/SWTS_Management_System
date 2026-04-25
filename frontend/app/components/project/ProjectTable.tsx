"use client";

import { useEffect, useRef, useState } from "react";
import { Project, ProjectStatus } from "../../types/project";
import {
  getProjects,
  getProjectStatuses,
  updateProjectStatus,
  toggleProjectPPP,
} from "../../lib/api";
import { bus } from "../../lib/bus";

export default function ProjectTable() {
  const [projects, setProjects]           = useState<Project[]>([]);
  const [statuses, setStatuses]           = useState<ProjectStatus[]>([]);
  const [loading,  setLoading]            = useState(true);
  const [error,    setError]              = useState<string | null>(null);
  const [openDropdown, setOpenDropdown]   = useState<number | null>(null);
  const dropdownRef                       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getProjects(), getProjectStatuses()])
      .then(([projs, stats]) => { setProjects(projs); setStatuses(stats); })
      .catch(() => setError("Failed to load projects."))
      .finally(() => setLoading(false));
  }, []);

  // Sync table rows when bus fires
  useEffect(() => {
    const sync = (p: Project) =>
      setProjects((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    bus.on("project:status-changed", sync);
    bus.on("project:ppp-toggled",    sync);
    return () => {
      bus.off("project:status-changed", sync);
      bus.off("project:ppp-toggled",    sync);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (openDropdown === null) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setOpenDropdown(null);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [openDropdown]);

  const handleStatusChange = async (projectId: number, statusId: number) => {
    setOpenDropdown(null);
    try {
      const updated = await updateProjectStatus(projectId, statusId);
      bus.emit("project:status-changed", updated);
    } catch { /* silently ignore */ }
  };

  const handleTogglePPP = async (projectId: number) => {
    try {
      const updated = await toggleProjectPPP(projectId);
      bus.emit("project:ppp-toggled", updated);
    } catch { /* silently ignore */ }
  };

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
      Loading projects…
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-500 text-sm">{error}</div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Developer</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Profit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {projects.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                No projects yet.
              </td>
            </tr>
          )}
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">

              {/* ID */}
              <td className="px-4 py-3 text-gray-400 text-xs font-mono">#{p.id}</td>

              {/* Project Name — clickable */}
              <td className="px-4 py-3">
                <a
                  href={`/projects/${p.id}`}
                  className="font-medium text-blue-600 hover:underline cursor-pointer"
                >
                  {p.project_name}
                </a>
              </td>

              {/* Client */}
              <td className="px-4 py-3 text-gray-700">{p.client?.name ?? "—"}</td>

              {/* Developer */}
              <td className="px-4 py-3 text-gray-700">{p.developer?.name ?? "—"}</td>

              {/* Status — dropdown */}
              <td className="px-4 py-3">
                <div className="relative inline-block" ref={openDropdown === p.id ? dropdownRef : null}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === p.id ? null : p.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: p.status?.color ?? "#9ca3af" }}
                  >
                    {p.status?.name ?? "—"}
                    <svg className="w-3 h-3 opacity-80" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </button>

                  {openDropdown === p.id && (
                    <div className="absolute z-20 mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                      {statuses.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleStatusChange(p.id, s.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </td>

              {/* Deadline */}
              <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(p.deadline)}</td>

              {/* Profit + PPP toggle */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 text-sm min-w-[60px]">
                    {p.show_ppp
                      ? p.profit_type === "percentage"
                        ? `${p.company_profit_value ?? 0}% / ${p.developer_profit_value ?? 0}%`
                        : `₹${p.company_profit_value ?? 0} / ₹${p.developer_profit_value ?? 0}`
                      : "NA"}
                  </span>
                  <button
                    onClick={() => handleTogglePPP(p.id)}
                    title="Toggle profit visibility"
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                      p.show_ppp ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                        p.show_ppp ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-xs text-gray-400">PPP</span>
                </div>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
