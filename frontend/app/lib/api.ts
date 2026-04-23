import { CalendarEvent } from "../types/event";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function getEventsByRange(
  userId: number,
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  return apiFetch(
    `${API_BASE}/events/?user_id=${userId}&start_date=${startDate}&end_date=${endDate}`
  );
}

export async function getUndatedEvents(
  userId: number,
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
  created_by: number;
  assigned_to: number;
}): Promise<CalendarEvent> {
  return apiFetch(`${API_BASE}/events/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(eventId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/events/${eventId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed ${res.status}`);
}
