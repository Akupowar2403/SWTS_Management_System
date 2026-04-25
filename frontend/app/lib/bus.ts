import mitt from "mitt";
import { CalendarEvent } from "../types/event";
import { Project } from "../types/project";

type Events = {
  "task:created":           CalendarEvent;
  "task:deleted":           { id: number };
  "task:updated":           CalendarEvent;
  "project:updated":        Project;  // any field edit on detail page
  "project:status-changed": Project;
  "project:ppp-toggled":    Project;
};

export const bus = mitt<Events>();
