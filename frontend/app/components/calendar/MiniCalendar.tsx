"use client";

import { useState } from "react";

interface Props {
  onDateSelect: (dateStr: string) => void;
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function MiniCalendar({ onDateSelect }: Props) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate();

  type Cell = { day: number; type: "prev" | "cur" | "next" };
  const cells: Cell[] = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, type: "prev" });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, type: "cur" });
  let nx = 1;
  while (cells.length % 7 !== 0 || cells.length < 35)
    cells.push({ day: nx++, type: "next" });

  const isToday = ({ day, type }: Cell) =>
    type === "cur" &&
    day === today.getDate() &&
    viewMonth === today.getMonth() &&
    viewYear  === today.getFullYear();

  const handleClick = ({ day, type }: Cell) => {
    let y = viewYear, m = viewMonth;
    if (type === "prev") { m--; if (m < 0)  { m = 11; y--; } }
    if (type === "next") { m++; if (m > 11) { m = 0;  y++; } }
    onDateSelect(`${y}-${String(m + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`);
  };

  const prev = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); } else setViewMonth(m => m-1); };
  const next = () => { if (viewMonth === 11){ setViewMonth(0);  setViewYear(y => y+1); } else setViewMonth(m => m+1); };

  return (
    <div className="select-none px-2 py-1">
      {/* Month + nav */}
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[13px] font-semibold text-gray-800">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <div className="flex">
          <button onClick={prev} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <button onClick={next} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-0.5">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="h-7 flex items-center justify-center text-[11px] font-semibold text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(cell)}
            className={`h-7 w-full flex items-center justify-center rounded-full text-xs font-medium transition-colors
              ${isToday(cell)
                ? "bg-blue-600 text-white"
                : cell.type === "cur"
                  ? "text-gray-900 hover:bg-gray-100"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
          >
            {cell.day}
          </button>
        ))}
      </div>
    </div>
  );
}
