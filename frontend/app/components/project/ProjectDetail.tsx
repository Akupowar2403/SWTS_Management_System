"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Project, ProjectStatus, Client, Developer } from "../../types/project";
import {
  getProject, updateProject,
  getProjectStatuses, getClients, getDevelopers,
} from "../../lib/api";
import { bus } from "../../lib/bus";

interface Props { projectId: number; }

// draft shape — only the editable fields
interface Draft {
  project_name:          string;
  client_name:           string;
  client_id:             number | undefined;
  developer_name:        string;
  developer_id:          number | undefined;
  status_id:             number | undefined;
  deadline:              string;
  profit_type:           "percentage" | "amount";
  company_profit_value:  string;
  developer_profit_value: string;
}

function toDraft(p: Project, clients: Client[], devs: Developer[]): Draft {
  return {
    project_name:          p.project_name,
    client_name:           p.client_name ?? clients.find((c) => c.id === p.client_id)?.name ?? "",
    client_id:             p.client_id,
    developer_name:        p.developer_name ?? devs.find((d) => d.id === p.developer_id)?.name ?? "",
    developer_id:          p.developer_id,
    status_id:             p.status_id,
    deadline:              p.deadline ?? "",
    profit_type:           p.profit_type ?? "percentage",
    company_profit_value:  p.company_profit_value != null ? String(p.company_profit_value) : "",
    developer_profit_value: p.developer_profit_value != null ? String(p.developer_profit_value) : "",
  };
}

function isDirty(a: Draft, b: Draft) {
  return (Object.keys(a) as (keyof Draft)[]).some((k) => a[k] !== b[k]);
}

// ── Searchable combobox ───────────────────────────────────────────────────────
function Combobox<T extends { id: number; name: string }>({
  value, items, onChange, onSelect, placeholder,
}: {
  value: string;
  items: T[];
  onChange: (v: string) => void;
  onSelect: (item: T) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const suggestions = items.filter(
    (i) => value.trim() && i.name.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          <p className="px-3 pt-1 pb-0.5 text-xs text-gray-400">Existing records</p>
          {suggestions.map((item) => (
            <button
              key={item.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onSelect(item); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition"
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Status dropdown ───────────────────────────────────────────────────────────
function StatusDropdown({
  statusId, statuses, onChange,
}: {
  statusId: number | undefined;
  statuses: ProjectStatus[];
  onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = statuses.find((s) => s.id === statusId);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white hover:border-gray-300 transition"
      >
        <span className="flex items-center gap-2">
          {current ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: current.color }} />
              <span>{current.name}</span>
            </>
          ) : (
            <span className="text-gray-400">Select status…</span>
          )}
        </span>
        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {statuses.map((s) => (
            <button
              key={s.id}
              onClick={() => { onChange(s.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition ${s.id === statusId ? "text-blue-600 font-medium" : "text-gray-700"}`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProjectDetail({ projectId }: Props) {
  const router = useRouter();

  const [project,  setProject]  = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [clients,  setClients]  = useState<Client[]>([]);
  const [devs,     setDevs]     = useState<Developer[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const [draft,    setDraft]    = useState<Draft | null>(null);
  const [original, setOriginal] = useState<Draft | null>(null);

  useEffect(() => {
    Promise.all([getProject(projectId), getProjectStatuses(), getClients(), getDevelopers()])
      .then(([proj, stats, cls, dvs]) => {
        setProject(proj);
        setStatuses(stats);
        setClients(cls);
        setDevs(dvs);
        const d = toDraft(proj, cls, dvs);
        setDraft(d);
        setOriginal(d);
      })
      .catch(() => setError("Failed to load project."))
      .finally(() => setLoading(false));
  }, [projectId]);

  const dirty = draft && original ? isDirty(draft, original) : false;

  const handleSave = async () => {
    if (!project || !draft) return;
    setSaving(true);
    try {
      // figure out what to send — free text vs FK
      const clientIsFromDB  = clients.some((c) => c.name === draft.client_name);
      const devIsFromDB     = devs.some((d) => d.name === draft.developer_name);

      const updated = await updateProject(project.id, {
        project_name:          draft.project_name,
        client_id:             clientIsFromDB  ? draft.client_id  : undefined,
        client_name:           !clientIsFromDB ? draft.client_name  || undefined : undefined,
        developer_id:          devIsFromDB     ? draft.developer_id : undefined,
        developer_name:        !devIsFromDB    ? draft.developer_name || undefined : undefined,
        status_id:             draft.status_id,
        deadline:              draft.deadline  || undefined,
        profit_type:           draft.profit_type,
        company_profit_value:  draft.company_profit_value  !== "" ? Number(draft.company_profit_value)  : undefined,
        developer_profit_value: draft.developer_profit_value !== "" ? Number(draft.developer_profit_value) : undefined,
      });

      setProject(updated);
      const newDraft = toDraft(updated, clients, devs);
      setDraft(newDraft);
      setOriginal(newDraft);
      bus.emit("project:updated", updated);
    } catch {
      setError("Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (original) setDraft({ ...original });
  };

  const updateDraft = (patch: Partial<Draft>) =>
    setDraft((prev) => prev ? { ...prev, ...patch } : prev);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
  );
  if (error || !project || !draft) return (
    <div className="flex items-center justify-center h-64 text-red-500 text-sm">
      {error ?? "Project not found."}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-6">

      {/* ── Back ── */}
      <button
        onClick={() => router.push("/projects")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-6"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Back to Projects
      </button>

      {/* ── Editable fields card ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project Details</h2>
          {dirty && (
            <span className="text-xs text-amber-500 font-medium">Unsaved changes</span>
          )}
        </div>

        <div className="space-y-4">

          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={draft.project_name}
              onChange={(e) => updateDraft({ project_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">

            {/* Client */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Client
              </label>
              <Combobox
                value={draft.client_name}
                items={clients}
                placeholder="Type client name…"
                onChange={(v) => updateDraft({ client_name: v, client_id: undefined })}
                onSelect={(c) => updateDraft({ client_name: c.name, client_id: c.id })}
              />
            </div>

            {/* Developer */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Developer / Freelancer
              </label>
              <Combobox
                value={draft.developer_name}
                items={devs}
                placeholder="Type any name…"
                onChange={(v) => updateDraft({ developer_name: v, developer_id: undefined })}
                onSelect={(d) => updateDraft({ developer_name: d.name, developer_id: d.id })}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <StatusDropdown
                statusId={draft.status_id}
                statuses={statuses}
                onChange={(id) => updateDraft({ status_id: id })}
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Deadline
              </label>
              <input
                type="date"
                value={draft.deadline}
                onChange={(e) => updateDraft({ deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              />
            </div>

          </div>

          {/* Profit Sharing */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Profit Sharing
              </label>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => updateDraft({ profit_type: "percentage", company_profit_value: "", developer_profit_value: "" })}
                  className={`px-3 py-1 rounded-md transition ${draft.profit_type === "percentage" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                >%</button>
                <button
                  type="button"
                  onClick={() => updateDraft({ profit_type: "amount", company_profit_value: "", developer_profit_value: "" })}
                  className={`px-3 py-1 rounded-md transition ${draft.profit_type === "amount" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                >₹</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Company&apos;s Share ({draft.profit_type === "percentage" ? "%" : "₹"})</label>
                <input
                  type="number"
                  min={0}
                  max={draft.profit_type === "percentage" ? 100 : undefined}
                  value={draft.company_profit_value}
                  placeholder={draft.profit_type === "percentage" ? "e.g. 70" : "e.g. 50000"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (draft.profit_type === "percentage" && val !== "") {
                      const n = Number(val);
                      if (n >= 0 && n <= 100) {
                        updateDraft({ company_profit_value: val, developer_profit_value: String(100 - n) });
                        return;
                      }
                    }
                    updateDraft({ company_profit_value: val });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Developer&apos;s Share ({draft.profit_type === "percentage" ? "%" : "₹"})</label>
                <input
                  type="number"
                  min={0}
                  max={draft.profit_type === "percentage" ? 100 : undefined}
                  value={draft.developer_profit_value}
                  placeholder={draft.profit_type === "percentage" ? "e.g. 30" : "e.g. 20000"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (draft.profit_type === "percentage" && val !== "") {
                      const n = Number(val);
                      if (n >= 0 && n <= 100) {
                        updateDraft({ developer_profit_value: val, company_profit_value: String(100 - n) });
                        return;
                      }
                    }
                    updateDraft({ developer_profit_value: val });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>
            </div>

          </div>

        </div>

        {/* Save / Cancel — only when dirty */}
        {dirty && (
          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <button className="pb-3 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">
            Overview
          </button>
        </nav>
      </div>

      {/* ── Overview tab ── */}
      <div className="grid grid-cols-2 gap-6 text-sm text-gray-700">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Company</p>
          <p>{project.company_name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Start Date</p>
          <p>{project.start_date ? new Date(project.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Timeline</p>
          <p>{project.timeline_days ? `${project.timeline_days} days` : "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Profit Split</p>
          <p>
            {project.company_profit_value != null
              ? `Company ${project.company_profit_value}${project.profit_type === "percentage" ? "%" : " ₹"} / Dev ${project.developer_profit_value}${project.profit_type === "percentage" ? "%" : " ₹"}`
              : "—"}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
          <p className="text-gray-600 leading-relaxed">{project.description ?? "—"}</p>
        </div>
      </div>

    </div>
  );
}
