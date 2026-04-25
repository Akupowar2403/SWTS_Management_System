"use client";

import { useRouter } from "next/navigation";
import ProjectTable from "../components/project/ProjectTable";

export default function ProjectsPage() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">

      {/* ── Page toolbar ── */}
      <div className="h-14 shrink-0 flex items-center px-6 gap-4 border-b border-gray-200">
        <h1 className="text-base font-semibold text-gray-900">Projects</h1>
        <div className="flex-1" />
        <button
          onClick={() => router.push("/projects/new")}
          className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          + New Project
        </button>
      </div>

      {/* ── Table ── */}
      <main className="flex-1 overflow-auto px-6 py-4">
        <ProjectTable />
      </main>

    </div>
  );
}
