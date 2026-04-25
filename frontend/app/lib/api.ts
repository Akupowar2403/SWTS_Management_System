import { CalendarEvent } from "../types/event";
import { Project, ProjectStatus } from "../types/project";
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

export async function getProjects(): Promise<Project[]> {
  return apiFetch(`${API_BASE}/projects/`);
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
