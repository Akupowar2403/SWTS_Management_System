"use client";

import { CalendarEvent } from "../types/event";
import { deleteEvent } from "../lib/api";
import { bus } from "../lib/bus";

interface Props {
  events: CalendarEvent[];
  order: "newest" | "oldest";
  onOrderChange: (order: "newest" | "oldest") => void;
}

export default function TaskList({ events, order, onOrderChange }: Props) {
  const handleDelete = async (id: number) => {
    await deleteEvent(id);
    bus.emit("task:deleted", { id });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <span className="text-xs font-semibold text-gray-800">Undated tasks</span>
        <select
          value={order}
          onChange={(e) => onOrderChange(e.target.value as "newest" | "oldest")}
          className="text-xs border border-gray-300 rounded px-1.5 py-0.5 text-gray-700 font-medium focus:outline-none bg-white"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {events.length === 0 && (
          <p className="text-xs text-gray-500 text-center mt-4">No undated tasks</p>
        )}
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded px-2.5 py-2 border-l-[3px] group"
            style={{
              borderLeftColor: event.assigned_to ? "#34a853" : "#4285f4",
              backgroundColor: event.assigned_to ? "#f0fdf4" : "#eff6ff",
            }}
          >
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{event.title}</p>
                {event.description && (
                  <p className="text-[11px] text-gray-600 mt-0.5 truncate">{event.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(event.id)}
                className="text-gray-300 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
