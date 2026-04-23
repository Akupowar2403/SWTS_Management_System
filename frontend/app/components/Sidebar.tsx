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
}

export default function Sidebar({ onCreateClick, onDateSelect, undatedEvents, order, onOrderChange }: Props) {
  return (
    <aside className="w-64 shrink-0 flex flex-col border-r border-[#dadce0] overflow-hidden">
      <div className="p-3">
        <button
          onClick={onCreateClick}
          className="flex items-center gap-3 pl-4 pr-6 py-3 rounded-2xl bg-white shadow-md hover:shadow-lg transition-shadow text-[#3c4043] text-sm font-medium"
        >
          <svg className="w-5 h-5 text-[#1a73e8]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          Create
        </button>
      </div>

      <div className="py-2">
        <MiniCalendar onDateSelect={onDateSelect} />
      </div>

      <div className="mx-4 border-t border-[#dadce0] my-2" />

      <div className="flex-1 px-3 pb-3 overflow-hidden flex flex-col min-h-0">
        <TaskList events={undatedEvents} order={order} onOrderChange={onOrderChange} />
      </div>
    </aside>
  );
}
