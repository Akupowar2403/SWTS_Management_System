"use client";

import { useState, useEffect } from "react";
import { CalendarEvent } from "../types/event";
import { deleteEvent } from "../lib/api";
import { bus } from "../lib/bus";
import EventDetailPopup from "./EventDetailPopup";

interface Popup { event: CalendarEvent; x: number; y: number; }

interface Props {
  events: CalendarEvent[];
  order: "newest" | "oldest";
  onOrderChange: (order: "newest" | "oldest") => void;
  resolveName: (id: string) => string;
  fmt12h: (t: string) => string;
  typeBadge: Record<string, { label: string; color: string }>;
}

export default function TaskList({ events, order, onOrderChange, resolveName, fmt12h, typeBadge }: Props) {
  const [popup, setPopup] = useState<Popup | null>(null);

  useEffect(() => {
    if (!popup) return;
    const handler = () => setPopup(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [popup]);

  const handleDelete = async (id: number) => {
    await deleteEvent(id);
    bus.emit("task:deleted", { id });
  };

  const handleTaskClick = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    const POPUP_W = 288;
    const POPUP_H = 260;
    const x = Math.min(e.clientX + 12, window.innerWidth - POPUP_W - 16);
    const y = Math.min(e.clientY + 12, window.innerHeight - POPUP_H - 16);
    setPopup({ event, x, y });
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
            onClick={(e) => handleTaskClick(e, event)}
            className="rounded px-2.5 py-2 border-l-[3px] group cursor-pointer hover:brightness-95 transition-all"
            style={{
              borderLeftColor: event.color || (event.assigned_to ? "#34a853" : "#4285f4"),
              backgroundColor: event.color ? `${event.color}22` : (event.assigned_to ? "#f0fdf4" : "#eff6ff"),
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
                onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                className="text-gray-300 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {popup && (
        <EventDetailPopup
          event={popup.event}
          x={popup.x}
          y={popup.y}
          resolveName={resolveName}
          fmt12h={fmt12h}
          typeBadge={typeBadge}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
