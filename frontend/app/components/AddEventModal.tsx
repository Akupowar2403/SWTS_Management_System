"use client";

import { useState, useEffect } from "react";
import { createEvent, assignTask, getUsers } from "../lib/api";
import { bus } from "../lib/bus";
import { useAuth } from "../auth/AuthContext";

interface Props {
  selectedDate?: string;
  onClose: () => void;
}

interface UserOption {
  id: string;
  name: string;
  username: string;
  email: string;
}

const PRESET_COLORS = [
  { hex: "#d50000", name: "Tomato" },
  { hex: "#e67c73", name: "Flamingo" },
  { hex: "#f4511e", name: "Tangerine" },
  { hex: "#f6bf26", name: "Banana" },
  { hex: "#33b679", name: "Sage" },
  { hex: "#0b8043", name: "Basil" },
  { hex: "#039be5", name: "Peacock" },
  { hex: "#3f51b5", name: "Blueberry" },
  { hex: "#8e24aa", name: "Grape" },
  { hex: "#616161", name: "Graphite" },
];

export default function AddEventModal({ selectedDate, onClose }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"add" | "assign">("add");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(selectedDate || "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [color, setColor] = useState<string>("");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "assign") {
      getUsers().then(setUsers).catch(() => setUsers([]));
    }
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let saved;
      if (mode === "assign") {
        saved = await assignTask({
          title,
          description,
          event_date: eventDate || undefined,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
          created_by: user!.id,
          assigned_to: assignedTo,
          color: color || undefined,
        });
      } else {
        saved = await createEvent({
          title,
          description,
          event_date: eventDate || undefined,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
          event_type: "task",
          created_by: user!.id,
          color: color || undefined,
        });
      }
      bus.emit("task:created", saved);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full border-0 border-b border-[#dadce0] py-1.5 text-sm text-[#202124] focus:outline-none focus:border-[#1a73e8] bg-transparent transition";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex gap-1 bg-[#f1f3f4] rounded-lg p-1">
            <button
              onClick={() => setMode("add")}
              className={`px-4 py-1 rounded-md text-sm font-medium transition
                ${mode === "add" ? "bg-white shadow-sm text-[#1a73e8]" : "text-[#5f6368] hover:text-[#202124]"}`}
            >
              Add task
            </button>
            <button
              onClick={() => setMode("assign")}
              className={`px-4 py-1 rounded-md text-sm font-medium transition
                ${mode === "assign" ? "bg-white shadow-sm text-[#34a853]" : "text-[#5f6368] hover:text-[#202124]"}`}
            >
              Assign task
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f3f4] text-[#5f6368] transition"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <input
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add title"
            className="w-full border-0 border-b-2 border-[#dadce0] py-1 text-lg text-[#202124] placeholder-[#bdc1c6] focus:outline-none focus:border-[#1a73e8] bg-transparent transition"
          />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-[#5f6368] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-[#5f6368] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
              </svg>
              <div className="flex gap-2 flex-1">
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputCls}
                  placeholder="Start"
                />
                <span className="text-[#5f6368] self-end pb-1.5">–</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputCls}
                  placeholder="End"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-[#5f6368] shrink-0 mt-1.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description"
                rows={2}
                className="w-full border-0 border-b border-[#dadce0] py-1 text-sm text-[#202124] placeholder-[#bdc1c6] focus:outline-none focus:border-[#1a73e8] bg-transparent transition resize-none"
              />
            </div>

            {/* Color picker */}
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 text-[#5f6368] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* No color (default) */}
                <button
                  type="button"
                  title="Default"
                  onClick={() => setColor("")}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition
                    ${color === "" ? "border-[#1a73e8]" : "border-gray-300 hover:border-gray-500"}`}
                  style={{ background: "conic-gradient(#e5e7eb 0deg 180deg, white 180deg)" }}
                >
                  {color === "" && (
                    <svg className="w-3 h-3 text-[#1a73e8]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </button>

                {PRESET_COLORS.map(({ hex, name }) => (
                  <button
                    key={hex}
                    type="button"
                    title={name}
                    onClick={() => setColor(hex)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition
                      ${color === hex ? "border-gray-700 scale-110" : "border-transparent hover:scale-110"}`}
                    style={{ backgroundColor: hex }}
                  >
                    {color === hex && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {mode === "assign" && (
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#5f6368] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <select
                  required
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select a person…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.username})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-[#1a73e8] rounded hover:bg-[#e8f0fe] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 text-sm font-medium text-white rounded transition disabled:opacity-50
                ${mode === "assign" ? "bg-[#34a853] hover:bg-[#2d9147]" : "bg-[#1a73e8] hover:bg-[#1765cc]"}`}
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
