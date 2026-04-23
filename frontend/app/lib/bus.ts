import mitt from "mitt";
import { CalendarEvent } from "../types/event";

type Events = {
  "task:created": CalendarEvent;
  "task:deleted": { id: number };
  "task:updated": CalendarEvent;
};

export const bus = mitt<Events>();
