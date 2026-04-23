"use client";

import { useState } from "react";
import { createEvent, assignTask } from "../lib/api";

interface Props {
  selectedDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddEventModal({ selectedDate, onClose, onSaved }: Props) {
  const [mode, setMode] = useState<"add" | "assign">("add");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(selectedDate || "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "assign") {
        await assignTask({
          title,
          description,
          event_date: eventDate || undefined,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
          created_by: 1, // TODO: replace with logged-in user id from Keycloak
          assigned_to: parseInt(assignedTo),
        });
      } else {
        await createEvent({
          title,
          description,
          event_date: eventDate || undefined,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
          event_type: "task",
          created_by: 1, // TODO: replace with logged-in user id from Keycloak
        });
      }
      onSaved();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {mode === "add" ? "Add Task" : "Assign Task"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
          <button
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${mode === "add" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
            onClick={() => setMode("add")}
          >
            Add Task
          </button>
          <button
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${mode === "assign" ? "bg-white shadow text-green-600" : "text-gray-500"}`}
            onClick={() => setMode("assign")}
          >
            Assign Task
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Title *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Date (optional)</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {mode === "assign" && (
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Assign To (User ID) *</label>
              <input
                required
                type="number"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                placeholder="Enter user ID"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-medium text-sm transition ${
              mode === "assign"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-blue-500 hover:bg-blue-600"
            } disabled:opacity-50`}
          >
            {loading ? "Saving..." : mode === "add" ? "Add Task" : "Assign Task"}
          </button>
        </form>
      </div>
    </div>
  );
}
