"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClients, getDevelopers, getLeadSources, getProjectStatuses,
  createClient, createDeveloper, createProject,
  NewClientPayload, NewDeveloperPayload,
} from "../../lib/api";
import { Client, Developer, LeadSource, ProjectStatus } from "../../types/project";

// ── helpers ───────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split("T")[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

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

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white";
const selectCls = inputCls + " appearance-none";

// ── Client dropdown ───────────────────────────────────────────────────────────

type ClientMode = "search" | "new";

function ClientSection({
  clients,
  clientMode, setClientMode,
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
          <button
            type="button"
            onClick={() => setClientMode("search")}
            className="text-xs text-gray-500 hover:text-gray-800 underline"
          >
            Cancel
          </button>
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
        onChange={(e) => {
          setFreeText(e.target.value);
          setSelectedClient(null);
          setSearch(e.target.value);
          setOpen(true);
        }}
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
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">No clients found</p>
            )}
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

// ── Developer dropdown ────────────────────────────────────────────────────────

type DevMode = "search" | "new";

function DeveloperSection({
  devs,
  devMode, setDevMode,
  selectedDev, setSelectedDev,
  freeText, setFreeText,
  newData, setNewData,
}: {
  devs: Developer[];
  devMode: DevMode; setDevMode: (m: DevMode) => void;
  selectedDev: Developer | null; setSelectedDev: (d: Developer | null) => void;
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

  const filtered = devs
    .filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  const displayValue = selectedDev ? selectedDev.name : freeText;

  if (devMode === "new") {
    return (
      <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/40 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">New Developer</p>
          <button
            type="button"
            onClick={() => setDevMode("search")}
            className="text-xs text-gray-500 hover:text-gray-800 underline"
          >
            Cancel
          </button>
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
        placeholder="Search or type developer name…"
        value={displayValue}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setFreeText(e.target.value);
          setSelectedDev(null);
          setSearch(e.target.value);
          setOpen(true);
        }}
      />
      {open && (
        <div className="absolute z-30 top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg py-1">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setDevMode("new"); setOpen(false); setFreeText(""); setSelectedDev(null); }}
            className="w-full text-left px-3 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 border-b border-gray-100"
          >
            + New Developer
          </button>
          <input
            type="text"
            placeholder="Search existing…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm border-b border-gray-100 focus:outline-none"
          />
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">No developers found</p>
            )}
            {filtered.map((d) => (
              <button
                key={d.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setSelectedDev(d); setFreeText(""); setOpen(false); setSearch(""); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 transition"
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function NewProjectForm() {
  const router = useRouter();

  const [clients,  setClients]  = useState<Client[]>([]);
  const [devs,     setDevs]     = useState<Developer[]>([]);
  const [sources,  setSources]  = useState<LeadSource[]>([]);
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // client state
  const [clientMode,     setClientMode]     = useState<ClientMode>("search");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientFreeText, setClientFreeText] = useState("");
  const [newClientData,  setNewClientData]  = useState<NewClientPayload>({
    name: "", contact_no: "", email: "", type: "individual", citizenship: "Indian",
    residential_address: "", description: "",
  });

  // developer state
  const [devMode,     setDevMode]     = useState<DevMode>("search");
  const [selectedDev, setSelectedDev] = useState<Developer | null>(null);
  const [devFreeText, setDevFreeText] = useState("");
  const [newDevData,  setNewDevData]  = useState<NewDeveloperPayload>({
    name: "", contact_no: "", email: "", type: "individual",
    residential_address: "", description: "",
    default_profit_sharing_percentage: undefined,
    tds_percentage: undefined,
  });

  // core project fields
  const [projectName,    setProjectName]    = useState("");
  const [leadSourceId,   setLeadSourceId]   = useState<number | undefined>();
  const [companyName,    setCompanyName]    = useState<"SWTS" | "SWTS Pvt. Ltd." | "">("");
  const [profitType,     setProfitType]     = useState<"percentage" | "amount">("percentage");
  const [companyProfit,  setCompanyProfit]  = useState<string>("");
  const [devProfit,      setDevProfit]      = useState<string>("");
  const [statusId,       setStatusId]       = useState<number | undefined>();
  const [startDate,      setStartDate]      = useState(today());
  const [timelineDays,   setTimelineDays]   = useState<string>("");
  const [deadline,       setDeadline]       = useState("");
  const [description,    setDescription]    = useState("");

  // auto-calculate deadline when start or timeline changes
  useEffect(() => {
    if (startDate && timelineDays && Number(timelineDays) > 0) {
      setDeadline(addDays(startDate, Number(timelineDays)));
    }
  }, [startDate, timelineDays]);

  useEffect(() => {
    Promise.all([getClients(), getDevelopers(), getLeadSources(), getProjectStatuses()])
      .then(([cls, dvs, srcs, stats]) => {
        setClients(cls);
        setDevs(dvs);
        setSources(srcs);
        setStatuses(stats);
        // default status to "In Touch"
        const inTouch = stats.find((s) => s.name.toLowerCase() === "in touch");
        if (inTouch) setStatusId(inTouch.id);
      })
      .catch(() => setError("Failed to load form data."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) { setError("Project name is required."); return; }

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
        clientId = created.id;
        clientNameVal = undefined;
      } else if (selectedClient) {
        clientId = selectedClient.id;
        clientNameVal = undefined;
      }

      let devId: number | undefined = selectedDev?.id;
      let devNameVal: string | undefined = devFreeText || undefined;

      if (devMode === "new") {
        if (!newDevData.name || !newDevData.contact_no || !newDevData.email || !newDevData.residential_address || !newDevData.description) {
          setError("All developer fields marked required must be filled.");
          setSaving(false);
          return;
        }
        const created = await createDeveloper(newDevData);
        devId = created.id;
        devNameVal = undefined;
      } else if (selectedDev) {
        devId = selectedDev.id;
        devNameVal = undefined;
      }

      const project = await createProject({
        project_name:           projectName.trim(),
        client_id:              clientId,
        client_name:            clientNameVal,
        developer_id:           devId,
        developer_name:         devNameVal,
        lead_source_id:         leadSourceId,
        status_id:              statusId,
        company_name:           companyName || undefined,
        profit_type:            profitType,
        company_profit_value:   companyProfit ? Number(companyProfit) : undefined,
        developer_profit_value: devProfit ? Number(devProfit) : undefined,
        start_date:             startDate || undefined,
        timeline_days:          timelineDays ? Number(timelineDays) : undefined,
        deadline:               deadline || undefined,
        description:            description || undefined,
      });

      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to create project: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6 py-6">

      {/* Back */}
      <button
        type="button"
        onClick={() => router.push("/projects")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-6"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Back to Projects
      </button>

      <h2 className="text-lg font-semibold text-gray-900 mb-6">New Project</h2>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Basic info ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Project Info</p>

        <Field label="Project Name" required>
          <input
            className={inputCls}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. E-commerce Website Redesign"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Lead Source">
            <select className={selectCls} value={leadSourceId ?? ""} onChange={(e) => setLeadSourceId(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">— Select source —</option>
              {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>

          <Field label="Company">
            <select className={selectCls} value={companyName} onChange={(e) => setCompanyName(e.target.value as typeof companyName)}>
              <option value="">— Select company —</option>
              <option value="SWTS">SWTS</option>
              <option value="SWTS Pvt. Ltd.">SWTS Pvt. Ltd.</option>
            </select>
          </Field>
        </div>
      </div>

      {/* ── Client ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Client</p>
        <ClientSection
          clients={clients}
          clientMode={clientMode} setClientMode={setClientMode}
          selectedClient={selectedClient} setSelectedClient={setSelectedClient}
          freeText={clientFreeText} setFreeText={setClientFreeText}
          newData={newClientData} setNewData={setNewClientData}
        />
      </div>

      {/* ── Developer ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Developer / Freelancer</p>
        <DeveloperSection
          devs={devs}
          devMode={devMode} setDevMode={setDevMode}
          selectedDev={selectedDev} setSelectedDev={setSelectedDev}
          freeText={devFreeText} setFreeText={setDevFreeText}
          newData={newDevData} setNewData={setNewDevData}
        />
      </div>

      {/* ── Profit ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Profit Sharing</p>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setProfitType("percentage")}
              className={`px-3 py-1 rounded-md transition ${profitType === "percentage" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => setProfitType("amount")}
              className={`px-3 py-1 rounded-md transition ${profitType === "amount" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              ₹
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label={`Company's Share (${profitType === "percentage" ? "%" : "₹"})`}>
            <input
              type="number"
              min={0}
              className={inputCls}
              placeholder={profitType === "percentage" ? "e.g. 70" : "e.g. 50000"}
              value={companyProfit}
              onChange={(e) => setCompanyProfit(e.target.value)}
            />
          </Field>
          <Field label={`Developer's Share (${profitType === "percentage" ? "%" : "₹"})`}>
            <input
              type="number"
              min={0}
              className={inputCls}
              placeholder={profitType === "percentage" ? "e.g. 30" : "e.g. 20000"}
              value={devProfit}
              onChange={(e) => setDevProfit(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* ── Timeline & Status ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Timeline & Status</p>
        <div className="grid grid-cols-2 gap-4">

          <Field label="Status">
            <select className={selectCls} value={statusId ?? ""} onChange={(e) => setStatusId(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">— Select status —</option>
              {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>

          <Field label="Start Date">
            <input type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>

          <Field label="Timeline (days)">
            <input
              type="number"
              min={1}
              className={inputCls}
              placeholder="e.g. 30"
              value={timelineDays}
              onChange={(e) => setTimelineDays(e.target.value)}
            />
          </Field>

          <Field label="Deadline (auto-calculated)">
            <input
              type="date"
              className={inputCls}
              value={deadline}
              onChange={(e) => { setDeadline(e.target.value); setTimelineDays(""); }}
            />
          </Field>

        </div>
      </div>

      {/* ── Description ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
        <Field label="Description">
          <textarea
            className={inputCls}
            rows={4}
            placeholder="Optional project notes…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {saving ? "Creating…" : "Create Project"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/projects")}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        >
          Cancel
        </button>
      </div>

    </form>
  );
}
