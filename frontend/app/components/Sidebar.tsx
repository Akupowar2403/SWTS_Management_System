"use client";

import { CalendarEvent } from "../types/event";
import MiniCalendar from "./MiniCalendar";
import TaskList from "./TaskList";

interface Props {
  onCreateClick: () => void;
  onDateSelect: (dateStr: string) => void;
  undatedEvents: CalendarEvent[];
  order: "newest" | "oldest";
  onOrderChange: (order: "newest" | "oldest") => void;
  resolveName: (id: string) => string;
  fmt12h: (t: string) => string;
  typeBadge: Record<string, { label: string; color: string }>;
}

export default function Sidebar({ onCreateClick, onDateSelect, undatedEvents, order, onOrderChange, resolveName, fmt12h, typeBadge }: Props) {
  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">

      {/* Create button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={onCreateClick}
          className="flex items-center gap-3 pl-3 pr-5 py-2.5 rounded-2xl shadow-md hover:shadow-lg bg-white transition-shadow text-gray-900 text-sm font-semibold"
        >
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Create
        </button>
      </div>

      {/* Mini calendar */}
      <div className="mt-1">
        <MiniCalendar onDateSelect={onDateSelect} />
      </div>

      {/* Divider */}
      <div className="mx-4 my-3 border-t border-gray-200" />

      {/* Undated tasks */}
      <div className="flex-1 px-3 pb-4 min-h-0 flex flex-col overflow-hidden">
        <TaskList events={undatedEvents} order={order} onOrderChange={onOrderChange} resolveName={resolveName} fmt12h={fmt12h} typeBadge={typeBadge} />
      </div>
    </aside>
  );
}
