"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarEvent } from "../types/event";
import { getEventsByRange, getUndatedEvents } from "../lib/api";
import { bus } from "../lib/bus";
import AddEventModal from "./AddEventModal";
import Sidebar from "./Sidebar";

const USER_ID = 1; // TODO: replace with Keycloak user id

const VIEWS = [
  { key: "dayGridMonth", label: "Month" },
  { key: "timeGridWeek", label: "Week" },
  { key: "timeGridDay",  label: "Day"   },
];

export default function Calendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [undatedEvents, setUndatedEvents] = useState<CalendarEvent[]>([]);
  const [order, setOrder] = useState<"newest" | "oldest">("newest");
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [headerTitle, setHeaderTitle] = useState("");
  const [currentView, setCurrentView] = useState("dayGridMonth");

  const fetchCalendarEvents = useCallback(async (start: string, end: string) => {
    const events = await getEventsByRange(USER_ID, start, end);
    setCalendarEvents(events);
  }, []);

  const fetchUndatedEvents = useCallback(async () => {
    const events = await getUndatedEvents(USER_ID, order);
    setUndatedEvents(events);
  }, [order]);

  const refetchAll = useCallback(() => {
    fetchUndatedEvents();
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      fetchCalendarEvents(
        api.view.currentStart.toISOString().split("T")[0],
        api.view.currentEnd.toISOString().split("T")[0]
      );
    }
  }, [fetchUndatedEvents, fetchCalendarEvents]);

  useEffect(() => { fetchUndatedEvents(); }, [fetchUndatedEvents]);

  useEffect(() => {
    bus.on("task:created", refetchAll);
    bus.on("task:deleted", refetchAll);
    bus.on("task:updated", refetchAll);
    return () => {
      bus.off("task:created", refetchAll);
      bus.off("task:deleted", refetchAll);
      bus.off("task:updated", refetchAll);
    };
  }, [refetchAll]);

  const handleDateClick = useCallback((arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr);
    setShowModal(true);
  }, []);

  const handleDatesSet = useCallback(
    (arg: { startStr: string; endStr: string; view: { title: string; type: string } }) => {
      fetchCalendarEvents(arg.startStr.split("T")[0], arg.endStr.split("T")[0]);
      setHeaderTitle(arg.view.title);
      setCurrentView(arg.view.type);
    },
    [fetchCalendarEvents]
  );

  const handleMiniDateSelect = useCallback((dateStr: string) => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.gotoDate(dateStr);
    api.changeView("timeGridWeek");
  }, []);

  const fcEvents = calendarEvents
    .filter((e) => e.event_date)
    .map((e) => ({
      id: String(e.id),
      title: e.title,
      start: e.start_time ? `${e.event_date}T${e.start_time}` : e.event_date!,
      end: e.end_time ? `${e.event_date}T${e.end_time}` : undefined,
      backgroundColor: e.assigned_to ? "#34a853" : "#4285f4",
      borderColor:     e.assigned_to ? "#34a853" : "#4285f4",
      extendedProps: { description: e.description },
    }));

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">

      {/* ── Top header ── */}
      <header className="flex items-center h-16 px-4 gap-4 border-b border-[#dadce0] shrink-0">

        {/* Logo */}
        <div className="flex items-center gap-2 w-60 shrink-0">
          <button className="p-2 rounded-full hover:bg-[#f1f3f4] text-[#5f6368]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          </button>
          <span className="text-xl font-normal text-[#3c4043] tracking-wide select-none">SWTS</span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => calendarRef.current?.getApi().today()}
            className="px-4 py-1.5 text-sm border border-[#dadce0] rounded hover:bg-[#f1f3f4] text-[#3c4043] transition"
          >
            Today
          </button>
          <button
            onClick={() => calendarRef.current?.getApi().prev()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f3f4] text-[#3c4043] text-xl leading-none"
          >
            ‹
          </button>
          <button
            onClick={() => calendarRef.current?.getApi().next()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f3f4] text-[#3c4043] text-xl leading-none"
          >
            ›
          </button>
          <h2 className="text-xl font-normal text-[#3c4043] ml-2 min-w-44 select-none">
            {headerTitle}
          </h2>
        </div>

        <div className="flex-1" />

        {/* View switcher */}
        <div className="flex items-center border border-[#dadce0] rounded overflow-hidden">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => calendarRef.current?.getApi().changeView(key)}
              className={`px-4 py-1.5 text-sm border-r border-[#dadce0] last:border-r-0 transition
                ${currentView === key
                  ? "bg-[#e8f0fe] text-[#1a73e8] font-medium"
                  : "hover:bg-[#f1f3f4] text-[#3c4043]"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* User avatar placeholder */}
        <button className="w-8 h-8 rounded-full bg-[#1a73e8] text-white text-sm font-medium flex items-center justify-center ml-1">
          U
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onCreateClick={() => { setSelectedDate(undefined); setShowModal(true); }}
          onDateSelect={handleMiniDateSelect}
          undatedEvents={undatedEvents}
          order={order}
          onOrderChange={setOrder}
        />

        <main className="flex-1 overflow-hidden">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            events={fcEvents}
            dateClick={handleDateClick}
            datesSet={handleDatesSet}
            height="100%"
            eventDisplay="block"
          />
        </main>
      </div>

      {showModal && (
        <AddEventModal
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
