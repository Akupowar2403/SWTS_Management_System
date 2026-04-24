export type EventType = "general" | "zoom" | "followup" | "task";

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  event_type: EventType;
  created_by: string;   // Keycloak UUID
  assigned_to?: string; // Keycloak UUID
  color?: string;
  created_at: string;
  updated_at?: string;
}
