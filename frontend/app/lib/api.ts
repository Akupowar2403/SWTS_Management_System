import { CalendarEvent } from "../types/event";
import { Project, ProjectStatus, Client, Developer, LeadSource, ProjectComment } from "../types/project";
import { keycloakToken } from "../auth/keycloak";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = keycloakToken();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getEventsByRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  return apiFetch(
    `${API_BASE}/events/?user_id=${userId}&start_date=${startDate}&end_date=${endDate}`
  );
}

export async function getUndatedEvents(
  userId: string,
  order: "newest" | "oldest" = "newest"
): Promise<CalendarEvent[]> {
  return apiFetch(
    `${API_BASE}/events/undated?user_id=${userId}&order=${order}`
  );
}

export async function createEvent(payload: Partial<CalendarEvent>): Promise<CalendarEvent> {
  return apiFetch(`${API_BASE}/events/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function assignTask(payload: {
  title: string;
  description?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  created_by: string;
  assigned_to: string;
  color?: string;
}): Promise<CalendarEvent> {
  return apiFetch(`${API_BASE}/events/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getUsers(): Promise<{ id: string; username: string; name: string; email: string }[]> {
  return apiFetch(`${API_BASE}/users/`);
}

export async function deleteEvent(eventId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${eventId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed ${res.status}`);
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function getProjectStatuses(): Promise<ProjectStatus[]> {
  return apiFetch(`${API_BASE}/projects/statuses`);
}

export async function getClients(search?: string): Promise<Client[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`${API_BASE}/projects/clients${q}`);
}

export async function getDevelopers(search?: string): Promise<Developer[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`${API_BASE}/projects/developers${q}`);
}

export async function getProjects(): Promise<Project[]> {
  return apiFetch(`${API_BASE}/projects/`);
}

export async function getProject(projectId: number): Promise<Project> {
  return apiFetch(`${API_BASE}/projects/${projectId}`);
}

export async function updateProject(
  projectId: number,
  payload: Partial<Pick<Project, "project_name" | "client_id" | "client_name" | "developer_id" | "developer_name" | "status_id" | "deadline" | "description" | "start_date" | "timeline_days" | "company_name" | "is_inhouse_developer" | "profit_type" | "company_profit_value" | "developer_profit_value">>
): Promise<Project> {
  return apiFetch(`${API_BASE}/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateProjectStatus(
  projectId: number,
  statusId: number
): Promise<Project> {
  return apiFetch(`${API_BASE}/projects/${projectId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status_id: statusId }),
  });
}

export async function toggleProjectPPP(projectId: number): Promise<Project> {
  return apiFetch(`${API_BASE}/projects/${projectId}/toggle-ppp`, {
    method: "PATCH",
  });
}

export async function getLeadSources(): Promise<LeadSource[]> {
  return apiFetch(`${API_BASE}/projects/lead-sources`);
}

export interface NewClientPayload {
  name: string;
  contact_no: string;
  email: string;
  type: "individual" | "enterprise";
  citizenship: "Indian" | "Foreign";
  residential_address?: string;
  description?: string;
}

export async function createClient(payload: NewClientPayload): Promise<Client> {
  return apiFetch(`${API_BASE}/projects/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export interface NewDeveloperPayload {
  name: string;
  contact_no: string;
  email: string;
  type: "individual" | "enterprise";
  residential_address: string;
  description: string;
  default_profit_sharing_percentage?: number;
  tds_percentage?: number;
}

export async function createDeveloper(payload: NewDeveloperPayload): Promise<Developer> {
  return apiFetch(`${API_BASE}/projects/developers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export interface NewProjectPayload {
  project_name: string;
  client_id?: number;
  client_name?: string;
  developer_id?: number;
  developer_name?: string;
  lead_source_id?: number;
  status_id?: number;
  company_name?: "SWTS" | "SWTS Pvt. Ltd.";
  is_inhouse_developer?: boolean;
  profit_type?: "percentage" | "amount";
  company_profit_value?: number;
  developer_profit_value?: number;
  start_date?: string;
  timeline_days?: number;
  deadline?: string;
  description?: string;
}

export async function createProject(payload: NewProjectPayload): Promise<Project> {
  return apiFetch(`${API_BASE}/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function getComments(projectId: number): Promise<ProjectComment[]> {
  return apiFetch(`${API_BASE}/projects/${projectId}/comments`);
}

export async function createComment(
  projectId: number,
  payload: { body: string; commented_at: string }
): Promise<ProjectComment> {
  return apiFetch(`${API_BASE}/projects/${projectId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateComment(
  projectId: number,
  commentId: number,
  payload: { body?: string; commented_at?: string }
): Promise<ProjectComment> {
  return apiFetch(`${API_BASE}/projects/${projectId}/comments/${commentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteComment(projectId: number, commentId: number): Promise<void> {
  const token = keycloakToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/projects/${projectId}/comments/${commentId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(`Delete failed ${res.status}`);
}
