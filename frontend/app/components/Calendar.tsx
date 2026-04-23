"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarEvent } from "../types/event";
import { getEventsByRange, getUndatedEvents, deleteEvent } from "../lib/api";
import AddEventModal from "./AddEventModal";
import TaskList from "./TaskList";

const USER_ID = 1; // TODO: replace with Keycloak user id

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [undatedEvents, setUndatedEvents] = useState<CalendarEvent[]>([]);
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();

  const fetchCalendarEvents = useCallback(async (start: string, end: string) => {
    const events = await getEventsByRange(USER_ID, start, end);
    setCalendarEvents(events);
  }, []);

  const fetchUndatedEvents = useCallback(async () => {
    const events = await getUndatedEvents(USER_ID, order);
    setUndatedEvents(events);
  }, [order]);

  useEffect(() => {
    fetchUndatedEvents();
  }, [fetchUndatedEvents]);

  const handleDateClick = (arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr);
    setShowModal(true);
  };

  const handleDatesSet = (arg: { startStr: string; endStr: string }) => {
    const start = arg.startStr.split("T")[0];
    const end = arg.endStr.split("T")[0];
    fetchCalendarEvents(start, end);
  };

  const handleDelete = async (id: number) => {
    await deleteEvent(id);
    fetchUndatedEvents();
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      fetchCalendarEvents(
        api.view.currentStart.toISOString().split("T")[0],
        api.view.currentEnd.toISOString().split("T")[0]
      );
    }
  };

  const handleSaved = () => {
    fetchUndatedEvents();
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      fetchCalendarEvents(
        api.view.currentStart.toISOString().split("T")[0],
        api.view.currentEnd.toISOString().split("T")[0]
      );
    }
  };

  const fcEvents = calendarEvents
    .filter((e) => e.event_date)
    .map((e) => ({
      id: String(e.id),
      title: e.title,
      start: e.start_time ? `${e.event_date}T${e.start_time}` : e.event_date!,
      end: e.end_time ? `${e.event_date}T${e.end_time}` : undefined,
      backgroundColor: e.assigned_to ? "#2ecc71" : "#3498db",
      borderColor: e.assigned_to ? "#27ae60" : "#2980b9",
      extendedProps: { description: e.description },
    }));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Calendar - center */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="bg-white rounded-2xl shadow-sm p-4 h-full">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">Calendar</h1>
            <button
              onClick={() => { setSelectedDate(undefined); setShowModal(true); }}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              + Add Task
            </button>
          </div>

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={fcEvents}
            dateClick={handleDateClick}
            datesSet={handleDatesSet}
            height="calc(100% - 60px)"
            eventDisplay="block"
          />
        </div>
      </div>

      {/* Task list - right side */}
      <div className="w-72 p-6 pl-0">
        <div className="bg-white rounded-2xl shadow-sm p-4 h-full">
          <TaskList
            events={undatedEvents}
            order={order}
            onOrderChange={setOrder}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {showModal && (
        <AddEventModal
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
