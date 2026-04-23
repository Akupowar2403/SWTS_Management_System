import { CalendarEvent } from "../types/event";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getEventsByRange(
  userId: number,
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> {
  const res = await fetch(
    `${API_BASE}/events/?user_id=${userId}&start_date=${startDate}&end_date=${endDate}`
  );
  return res.json();
}

export async function getUndatedEvents(
  userId: number,
  order: "newest" | "oldest" = "newest"
): Promise<CalendarEvent[]> {
  const res = await fetch(
    `${API_BASE}/events/undated?user_id=${userId}&order=${order}`
  );
  return res.json();
}

export async function createEvent(payload: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const res = await fetch(`${API_BASE}/events/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
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
  const res = await fetch(`${API_BASE}/events/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function deleteEvent(eventId: number): Promise<void> {
  await fetch(`${API_BASE}/events/${eventId}`, { method: "DELETE" });
}
