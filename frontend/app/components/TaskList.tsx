"use client";

import { CalendarEvent } from "../types/event";

interface Props {
  events: CalendarEvent[];
  order: "newest" | "oldest";
  onOrderChange: (order: "newest" | "oldest") => void;
  onDelete: (id: number) => void;
}

export default function TaskList({ events, order, onOrderChange, onDelete }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-700 text-sm">Undated Tasks</h2>
        <select
          value={order}
          onChange={(e) => onOrderChange(e.target.value as "newest" | "oldest")}
          className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 focus:outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {events.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-6">No undated tasks</p>
        )}
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-lg p-3 text-sm border-l-4"
            style={{
              borderLeftColor: event.assigned_to ? "#2ecc71" : "#3498db",
              backgroundColor: event.assigned_to ? "#f0fdf4" : "#eff6ff",
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{event.title}</p>
                {event.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                )}
                <span
                  className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: event.assigned_to ? "#dcfce7" : "#dbeafe",
                    color: event.assigned_to ? "#16a34a" : "#2563eb",
                  }}
                >
                  {event.assigned_to ? "Assigned" : "Added"}
                </span>
              </div>
              <button
                onClick={() => onDelete(event.id)}
                className="text-gray-300 hover:text-red-400 text-xs ml-2"
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
