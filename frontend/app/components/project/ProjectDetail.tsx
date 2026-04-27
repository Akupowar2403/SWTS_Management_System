"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Project, ProjectStatus, Client, Developer } from "../../types/project";
import {
  getProject, updateProject,
  getProjectStatuses, getClients, getDevelopers, getUsers,
  createClient, createDeveloper,
  NewClientPayload, NewDeveloperPayload,
} from "../../lib/api";

type KCUser = { id: string; username: string; name: string; email: string };
import { bus } from "../../lib/bus";

interface Props { projectId: number; }

// draft shape — only the editable fields
interface Draft {
  project_name:           string;
  client_name:            string;
  client_id:              number | undefined;
  developer_name:         string;
  developer_id:           number | undefined;
  is_inhouse_developer:   boolean;
  status_id:              number | undefined;
  deadline:               string;
  profit_type:            "percentage" | "amount";
  company_profit_value:   string;
  developer_profit_value: string;
}

function toDraft(p: Project, clients: Client[], devs: Developer[]): Draft {
  return {
    project_name:           p.project_name,
    client_name:            p.client_name ?? clients.find((c) => c.id === p.client_id)?.name ?? "",
    client_id:              p.client_id,
    developer_name:         p.developer_name ?? devs.find((d) => d.id === p.developer_id)?.name ?? "",
    developer_id:           p.developer_id,
    is_inhouse_developer:   p.is_inhouse_developer ?? false,
    status_id:              p.status_id,
    deadline:               p.deadline ?? "",
    profit_type:            p.profit_type ?? "percentage",
    company_profit_value:   p.company_profit_value != null ? String(p.company_profit_value) : "",
    developer_profit_value: p.developer_profit_value != null ? String(p.developer_profit_value) : "",
  };
}

function isDirty(a: Draft, b: Draft) {
  return (Object.keys(a) as (keyof Draft)[]).some((k) => a[k] !== b[k]);
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white";
const selectCls = inputCls + " appearance-none";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Client section ────────────────────────────────────────────────────────────
type ClientMode = "search" | "new";

function ClientSection({
  clients, clientMode, setClientMode,
  selectedClient, setSelectedClient,
  freeText, setFreeText,
  newData, setNewData,
}: {
  clients: Client[];
  clientMode: ClientMode; setClientMode: (m: ClientMode) => void;
  selectedClient: Client | null; setSelectedClient: (c: Client | null) => void;
  freeText: string; setFreeText: (v: string) => void;
  newData: NewClientPayload; setNewData: (d: NewClientPayload) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  const filtered = clients
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  const displayValue = selectedClient ? selectedClient.name : freeText;

  if (clientMode === "new") {
    return (
      <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/40 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">New Client</p>
          <button type="button" onClick={() => setClientMode("search")} className="text-xs text-gray-500 hover:text-gray-800 underline">Cancel</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" required>
            <input className={inputCls} value={newData.name} onChange={(e) => setNewData({ ...newData, name: e.target.value })} />
          </Field>
          <Field label="Contact No." required>
            <input className={inputCls} value={newData.contact_no} onChange={(e) => setNewData({ ...newData, contact_no: e.target.value })} />
          </Field>
          <Field label="Email" required>
            <input type="email" className={inputCls} value={newData.email} onChange={(e) => setNewData({ ...newData, email: e.target.value })} />
          </Field>
          <Field label="Type" required>
            <select className={selectCls} value={newData.type} onChange={(e) => setNewData({ ...newData, type: e.target.value as "individual" | "enterprise" })}>
              <option value="individual">Individual</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </Field>
          <Field label="Citizenship" required>
            <select className={selectCls} value={newData.citizenship} onChange={(e) => setNewData({ ...newData, citizenship: e.target.value as "Indian" | "Foreign" })}>
              <option value="Indian">Indian</option>
              <option value="Foreign">Foreign</option>
            </select>
          </Field>
          <Field label="Residential Address">
            <input className={inputCls} value={newData.residential_address ?? ""} onChange={(e) => setNewData({ ...newData, residential_address: e.target.value })} />
          </Field>
          <div className="col-span-2">
            <Field label="Description">
              <textarea className={inputCls} rows={2} value={newData.description ?? ""} onChange={(e) => setNewData({ ...newData, description: e.target.value })} />
            </Field>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        className={inputCls}
        placeholder="Search or type client name…"
        value={displayValue}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setFreeText(e.target.value); setSelectedClient(null); setSearch(e.target.value); setOpen(true); }}
      />
      {open && (
        <div className="absolute z-30 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg py-1">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setClientMode("new"); setOpen(false); setFreeText(""); setSelectedClient(null); }}
            className="w-full text-left px-3 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 border-b border-gray-100"
          >
            + New Client
          </button>
          <input
            type="text"
            placeholder="Search existing…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border-b border-gray-100 focus:outline-none"
          />
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No clients found</p>}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setSelectedClient(c); setFreeText(""); setOpen(false); setSearch(""); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Developer section ─────────────────────────────────────────────────────────
type DevMode = "search" | "new";

function DeveloperSection({
  devs, keycloakUsers, devMode, setDevMode,
  selectedDev, setSelectedDev,
  selectedInhouse, setSelectedInhouse,
  freeText, setFreeText,
  newData, setNewData,
}: {
  devs: Developer[];
  keycloakUsers: KCUser[];
  devMode: DevMode; setDevMode: (m: DevMode) => void;
  selectedDev: Developer | null; setSelectedDev: (d: Developer | null) => void;
  selectedInhouse: KCUser | null; setSelectedInhouse: (u: KCUser | null) => void;
  freeText: string; setFreeText: (v: string) => void;
  newData: NewDeveloperPayload; setNewData: (d: NewDeveloperPayload) => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  const filteredInhouse = keycloakUsers
    .filter((u) => !search || (u.name || u.username).toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  const filteredDevs = devs
    .filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  const displayValue = selectedInhouse
    ? (selectedInhouse.name || selectedInhouse.username)
    : (selectedDev ? selectedDev.name : freeText);

  if (devMode === "new") {
    return (
      <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/40 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">New Freelancer</p>
          <button type="button" onClick={() => setDevMode("search")} className="text-xs text-gray-500 hover:text-gray-800 underline">Cancel</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" required>
            <input className={inputCls} value={newData.name} onChange={(e) => setNewData({ ...newData, name: e.target.value })} />
          </Field>
          <Field label="Contact No." required>
            <input className={inputCls} value={newData.contact_no} onChange={(e) => setNewData({ ...newData, contact_no: e.target.value })} />
          </Field>
          <Field label="Email" required>
            <input type="email" className={inputCls} value={newData.email} onChange={(e) => setNewData({ ...newData, email: e.target.value })} />
          </Field>
          <Field label="Type" required>
            <select className={selectCls} value={newData.type} onChange={(e) => setNewData({ ...newData, type: e.target.value as "individual" | "enterprise" })}>
              <option value="individual">Individual</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </Field>
          <Field label="Residential Address" required>
            <input className={inputCls} value={newData.residential_address} onChange={(e) => setNewData({ ...newData, residential_address: e.target.value })} />
          </Field>
          <Field label="Default Profit Sharing %" required>
            <input type="number" min={0} max={100} className={inputCls} value={newData.default_profit_sharing_percentage ?? ""} onChange={(e) => setNewData({ ...newData, default_profit_sharing_percentage: e.target.value ? Number(e.target.value) : undefined })} />
          </Field>
          <Field label="TDS %" required>
            <input type="number" min={0} max={100} className={inputCls} value={newData.tds_percentage ?? ""} onChange={(e) => setNewData({ ...newData, tds_percentage: e.target.value ? Number(e.target.value) : undefined })} />
          </Field>
          <div className="col-span-2">
            <Field label="Description" required>
              <textarea className={inputCls} rows={2} value={newData.description} onChange={(e) => setNewData({ ...newData, description: e.target.value })} />
            </Field>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        className={inputCls}
        placeholder="Search team or freelancer…"
        value={displayValue}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setFreeText(e.target.value); setSelectedDev(null); setSelectedInhouse(null); setSearch(e.target.value); setOpen(true); }}
      />
      {open && (
        <div className="absolute z-30 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg py-1">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setDevMode("new"); setOpen(false); setFreeText(""); setSelectedDev(null); setSelectedInhouse(null); }}
            className="w-full text-left px-3 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 border-b border-gray-100"
          >
            + New Freelancer
          </button>
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border-b border-gray-100 focus:outline-none"
          />
          <div className="max-h-52 overflow-y-auto">
            {filteredInhouse.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Team Members</p>
                {filteredInhouse.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setSelectedInhouse(u); setSelectedDev(null); setFreeText(""); setOpen(false); setSearch(""); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    {u.name || u.username}
                  </button>
                ))}
              </>
            )}
            {filteredDevs.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Freelancers</p>
                {filteredDevs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setSelectedDev(d); setSelectedInhouse(null); setFreeText(""); setOpen(false); setSearch(""); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition"
                  >
                    {d.name}
                  </button>
                ))}
              </>
            )}
            {filteredInhouse.length === 0 && filteredDevs.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">No results found</p>
            )}
          </div>
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

  // client section state
  const [clientMode,     setClientMode]     = useState<ClientMode>("search");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientFreeText, setClientFreeText] = useState("");
  const [newClientData,  setNewClientData]  = useState<NewClientPayload>({
    name: "", contact_no: "", email: "", type: "individual", citizenship: "Indian",
    residential_address: "", description: "",
  });

  // developer section state
  const [devMode,           setDevMode]           = useState<DevMode>("search");
  const [selectedDev,       setSelectedDev]       = useState<Developer | null>(null);
  const [selectedInhouseDev, setSelectedInhouseDev] = useState<KCUser | null>(null);
  const [keycloakUsers,     setKeycloakUsers]     = useState<KCUser[]>([]);
  const [devFreeText,       setDevFreeText]       = useState("");
  const [newDevData,        setNewDevData]        = useState<NewDeveloperPayload>({
    name: "", contact_no: "", email: "", type: "individual",
    residential_address: "", description: "",
    default_profit_sharing_percentage: undefined,
    tds_percentage: undefined,
  });

  useEffect(() => {
    Promise.all([getProject(projectId), getProjectStatuses(), getClients(), getDevelopers(), getUsers()])
      .then(([proj, stats, cls, dvs, kcUsers]) => {
        setProject(proj);
        setStatuses(stats);
        setClients(cls);
        setDevs(dvs);
        setKeycloakUsers(kcUsers);
        const d = toDraft(proj, cls, dvs);
        setDraft(d);
        setOriginal(d);
        // initialise client section
        const matchedClient = cls.find((c) => c.id === proj.client_id) ?? null;
        setSelectedClient(matchedClient);
        setClientFreeText(matchedClient ? "" : (proj.client_name ?? ""));
        // initialise developer section
        if (proj.is_inhouse_developer) {
          const kcMatch = kcUsers.find(
            (u) => (u.name || u.username).toLowerCase() === (proj.developer_name ?? "").toLowerCase()
          ) ?? null;
          setSelectedInhouseDev(kcMatch);
          setSelectedDev(null);
          setDevFreeText(kcMatch ? "" : (proj.developer_name ?? ""));
        } else {
          const matchedDev = dvs.find((dv) => dv.id === proj.developer_id) ?? null;
          setSelectedDev(matchedDev);
          setSelectedInhouseDev(null);
          setDevFreeText(matchedDev ? "" : (proj.developer_name ?? ""));
        }
      })
      .catch(() => setError("Failed to load project."))
      .finally(() => setLoading(false));
  }, [projectId]);

  const dirty =
    (draft && original ? isDirty(draft, original) : false) ||
    clientMode === "new" ||
    devMode === "new";

  const handleSave = async () => {
    if (!project || !draft) return;
    setSaving(true);
    setError(null);
    try {
      let clientId: number | undefined = selectedClient?.id;
      let clientNameVal: string | undefined = clientFreeText || undefined;

      if (clientMode === "new") {
        if (!newClientData.name || !newClientData.contact_no || !newClientData.email) {
          setError("Client name, contact no., and email are required.");
          setSaving(false);
          return;
        }
        const created = await createClient(newClientData);
        setClients((prev) => [...prev, created]);
        setSelectedClient(created);
        setClientFreeText("");
        setClientMode("search");
        setNewClientData({ name: "", contact_no: "", email: "", type: "individual", citizenship: "Indian", residential_address: "", description: "" });
        clientId = created.id;
        clientNameVal = undefined;
      } else if (selectedClient) {
        clientId = selectedClient.id;
        clientNameVal = undefined;
      }

      let devId: number | undefined = selectedDev?.id;
      let devNameVal: string | undefined;
      let isInhouse = false;

      if (selectedInhouseDev) {
        isInhouse = true;
        devId = undefined;
        devNameVal = selectedInhouseDev.name || selectedInhouseDev.username;
      } else if (devMode === "new") {
        if (!newDevData.name || !newDevData.contact_no || !newDevData.email || !newDevData.residential_address || !newDevData.description) {
          setError("All required developer fields must be filled.");
          setSaving(false);
          return;
        }
        const created = await createDeveloper(newDevData);
        setDevs((prev) => [...prev, created]);
        setSelectedDev(created);
        setDevFreeText("");
        setDevMode("search");
        setNewDevData({ name: "", contact_no: "", email: "", type: "individual", residential_address: "", description: "", default_profit_sharing_percentage: undefined, tds_percentage: undefined });
        devId = created.id;
        devNameVal = undefined;
        isInhouse = false;
      } else if (selectedDev) {
        devId = selectedDev.id;
        devNameVal = undefined;
        isInhouse = false;
      } else if (devFreeText) {
        devNameVal = devFreeText;
        devId = undefined;
        isInhouse = false;
      }

      const updated = await updateProject(project.id, {
        project_name:           draft.project_name,
        client_id:              clientId,
        client_name:            clientNameVal,
        developer_id:           devId,
        developer_name:         devNameVal,
        is_inhouse_developer:   isInhouse,
        status_id:              draft.status_id,
        deadline:               draft.deadline  || undefined,
        profit_type:            draft.profit_type,
        company_profit_value:   isInhouse ? undefined : (draft.company_profit_value  !== "" ? Number(draft.company_profit_value)  : undefined),
        developer_profit_value: isInhouse ? undefined : (draft.developer_profit_value !== "" ? Number(draft.developer_profit_value) : undefined),
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
    if (!original) return;
    setDraft({ ...original });
    setClientMode("search");
    const matchedClient = clients.find((c) => c.id === original.client_id) ?? null;
    setSelectedClient(matchedClient);
    setClientFreeText(matchedClient ? "" : (original.client_name ?? ""));
    setNewClientData({ name: "", contact_no: "", email: "", type: "individual", citizenship: "Indian", residential_address: "", description: "" });
    setDevMode("search");
    if (original.is_inhouse_developer) {
      const kcMatch = keycloakUsers.find(
        (u) => (u.name || u.username).toLowerCase() === (original.developer_name ?? "").toLowerCase()
      ) ?? null;
      setSelectedInhouseDev(kcMatch);
      setSelectedDev(null);
      setDevFreeText(kcMatch ? "" : (original.developer_name ?? ""));
    } else {
      const matchedDev = devs.find((d) => d.id === original.developer_id) ?? null;
      setSelectedDev(matchedDev);
      setSelectedInhouseDev(null);
      setDevFreeText(matchedDev ? "" : (original.developer_name ?? ""));
    }
    setNewDevData({ name: "", contact_no: "", email: "", type: "individual", residential_address: "", description: "", default_profit_sharing_percentage: undefined, tds_percentage: undefined });
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
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Client
              </label>
              <ClientSection
                clients={clients}
                clientMode={clientMode} setClientMode={setClientMode}
                selectedClient={selectedClient}
                setSelectedClient={(c) => { setSelectedClient(c); updateDraft({ client_name: c?.name ?? "", client_id: c?.id }); }}
                freeText={clientFreeText}
                setFreeText={(v) => { setClientFreeText(v); updateDraft({ client_name: v, client_id: undefined }); }}
                newData={newClientData} setNewData={setNewClientData}
              />
            </div>

            {/* Developer */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Developer / Freelancer
              </label>
              <DeveloperSection
                devs={devs}
                keycloakUsers={keycloakUsers}
                devMode={devMode} setDevMode={setDevMode}
                selectedDev={selectedDev}
                setSelectedDev={(d) => {
                  setSelectedDev(d);
                  setSelectedInhouseDev(null);
                  updateDraft({
                    developer_name: d?.name ?? "",
                    developer_id: d?.id,
                    is_inhouse_developer: false,
                  });
                }}
                selectedInhouse={selectedInhouseDev}
                setSelectedInhouse={(u) => {
                  setSelectedInhouseDev(u);
                  setSelectedDev(null);
                  updateDraft({
                    developer_name: u ? (u.name || u.username) : "",
                    developer_id: undefined,
                    is_inhouse_developer: u !== null,
                    ...(u !== null ? { company_profit_value: "", developer_profit_value: "" } : {}),
                  });
                }}
                freeText={devFreeText}
                setFreeText={(v) => { setDevFreeText(v); setSelectedDev(null); setSelectedInhouseDev(null); updateDraft({ developer_name: v, developer_id: undefined, is_inhouse_developer: false }); }}
                newData={newDevData} setNewData={setNewDevData}
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

          {/* Profit Sharing — hidden when in-house developer */}
          {!draft.is_inhouse_developer && <div className="pt-2">
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

          </div>}

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
