"use client";

import { useState } from "react";

interface Props {
  onDateSelect: (dateStr: string) => void;
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function MiniCalendar({ onDateSelect }: Props) {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const handleClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onDateSelect(dateStr);
  };

  return (
    <div className="px-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-[#3c4043]">
          {MONTHS[month]} {year}
        </span>
        <div className="flex">
          <button
            onClick={() => setView(new Date(year, month - 1, 1))}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#f1f3f4] text-[#70757a] text-base leading-none"
          >
            ‹
          </button>
          <button
            onClick={() => setView(new Date(year, month + 1, 1))}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#f1f3f4] text-[#70757a] text-base leading-none"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-0.5">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-[#70757a] font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) =>
          day === null ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => handleClick(day)}
              className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full text-[11px] transition
                ${isToday(day)
                  ? "bg-[#1a73e8] text-white font-semibold"
                  : "hover:bg-[#f1f3f4] text-[#3c4043]"
                }`}
            >
              {day}
            </button>
          )
        )}
      </div>
    </div>
  );
}
