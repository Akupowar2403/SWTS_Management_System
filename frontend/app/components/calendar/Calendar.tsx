"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarEvent } from "../../types/event";
import { getEventsByRange, getUndatedEvents, getUsers } from "../../lib/api";
import { bus } from "../../lib/bus";
import { useAuth } from "../../auth/AuthContext";
import AddEventModal from "./AddEventModal";
import Sidebar from "./Sidebar";
import EventDetailPopup from "./EventDetailPopup";

const VIEWS = [
  { key: "dayGridMonth", label: "Month" },
  { key: "timeGridWeek", label: "Week" },
  { key: "timeGridDay",  label: "Day"   },
];

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  task:     { label: "Task",      color: "#6366f1" },
  zoom:     { label: "Zoom",      color: "#0ea5e9" },
  followup: { label: "Follow-up", color: "#f59e0b" },
  general:  { label: "General",   color: "#6b7280" },
};

interface ClickPopup {
  event: CalendarEvent;
  x: number;
  y: number;
}

export default function Calendar() {
  const { user } = useAuth();
  const calendarRef = useRef<FullCalendar>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [undatedEvents,  setUndatedEvents]  = useState<CalendarEvent[]>([]);
  const [order,          setOrder]          = useState<"newest" | "oldest">("newest");
  const [showModal,      setShowModal]      = useState(false);
  const [selectedDate,   setSelectedDate]   = useState<string | undefined>();
  const [headerTitle,    setHeaderTitle]    = useState("");
  const [currentView,    setCurrentView]    = useState("dayGridMonth");
  const [popup,          setPopup]          = useState<ClickPopup | null>(null);
  const [usersMap,       setUsersMap]       = useState<Record<string, string>>({});

  // Build id→name map once on mount
  useEffect(() => {
    getUsers()
      .then((list) => {
        const map: Record<string, string> = {};
        list.forEach((u) => { map[u.id] = u.name || u.username; });
        setUsersMap(map);
      })
      .catch(() => {});
  }, []);

  const fetchCalendarEvents = useCallback(async (start: string, end: string) => {
    if (!user) return;
    const events = await getEventsByRange(user.id, start, end);
    setCalendarEvents(events);
  }, [user]);

  const fetchUndatedEvents = useCallback(async () => {
    if (!user) return;
    const events = await getUndatedEvents(user.id, order);
    setUndatedEvents(events);
  }, [user, order]);

  const refetchAll = useCallback(() => {
    fetchUndatedEvents();
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      fetchCalendarEvents(
        api.view.currentStart.toISOString().split("T")[0],
        api.view.currentEnd.toISOString().split("T")[0],
      );
    }
  }, [fetchUndatedEvents, fetchCalendarEvents]);

  useEffect(() => { fetchUndatedEvents(); }, [fetchUndatedEvents]);

  // Close popup on any click outside
  useEffect(() => {
    if (!popup) return;
    const handler = () => setPopup(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [popup]);

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
    [fetchCalendarEvents],
  );

  const handleMiniDateSelect = useCallback((dateStr: string) => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.gotoDate(dateStr);
    api.changeView("timeGridWeek");
  }, []);

  const handleEventClick = useCallback((info: { event: { id: string }; jsEvent: MouseEvent }) => {
    info.jsEvent.stopPropagation();
    const calEvent = calendarEvents.find((e) => String(e.id) === info.event.id);
    if (!calEvent) return;
    const POPUP_W = 288;
    const POPUP_H = 260;
    const x = Math.min(info.jsEvent.clientX + 12, window.innerWidth - POPUP_W - 16);
    const y = Math.min(info.jsEvent.clientY + 12, window.innerHeight - POPUP_H - 16);
    setPopup({ event: calEvent, x, y });
  }, [calendarEvents]);

  const fcEvents = calendarEvents
    .filter((e) => e.event_date)
    .map((e) => {
      const eventColor = e.color || (e.assigned_to ? "#34a853" : "#4285f4");
      return {
        id: String(e.id),
        title: e.title,
        start: e.start_time ? `${e.event_date}T${e.start_time}` : e.event_date!,
        end:   e.end_time   ? `${e.event_date}T${e.end_time}`   : undefined,
        backgroundColor: eventColor,
        borderColor:     eventColor,
      };
    });

  const resolveName = (id: string) => {
    if (id === user?.id) return "You";
    return usersMap[id] || id.slice(0, 8) + "…";
  };

  const fmt12h = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">

      {/* ── Calendar toolbar ── */}
      <div className="h-14 shrink-0 flex items-center px-4 gap-4 border-b border-gray-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => calendarRef.current?.getApi().today()}
            className="px-3.5 py-1.5 text-sm font-medium border border-gray-300 rounded hover:bg-gray-100 text-gray-800 transition"
          >
            Today
          </button>
          <button
            onClick={() => calendarRef.current?.getApi().prev()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <button
            onClick={() => calendarRef.current?.getApi().next()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-700"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
          <h2 className="text-xl font-bold text-black ml-1 min-w-[180px] select-none">
            {headerTitle}
          </h2>
        </div>

        <div className="flex-1" />

        <div className="flex items-center border border-gray-300 rounded overflow-hidden text-sm">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => calendarRef.current?.getApi().changeView(key)}
              className={`px-4 py-1.5 font-medium border-r border-gray-300 last:border-r-0 transition
                ${currentView === key ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100 text-gray-800"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onCreateClick={() => { setSelectedDate(undefined); setShowModal(true); }}
          onDateSelect={handleMiniDateSelect}
          undatedEvents={undatedEvents}
          order={order}
          onOrderChange={setOrder}
          resolveName={resolveName}
          fmt12h={fmt12h}
          typeBadge={TYPE_BADGE}
        />

        <main className="flex-1 overflow-hidden">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            nowIndicator={true}
            events={fcEvents}
            dateClick={handleDateClick}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            height="100%"
            eventDisplay="block"
            slotMinTime="06:00:00"
            slotLabelFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}

            dayHeaderContent={(arg) => {
              const isMonth = arg.view.type === "dayGridMonth";
              if (isMonth) {
                return (
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {arg.date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                );
              }
              const dayName = arg.date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
              const dateNum = arg.date.getDate();
              return (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 6px", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", color: arg.isToday ? "#2563eb" : "#6b7280" }}>
                    {dayName}
                  </span>
                  <span style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 40, height: 40, borderRadius: "50%", fontSize: 22,
                    fontWeight: arg.isToday ? 700 : 400,
                    backgroundColor: arg.isToday ? "#2563eb" : "transparent",
                    color: arg.isToday ? "#ffffff" : "#111827",
                    cursor: "default",
                  }}>
                    {dateNum}
                  </span>
                </div>
              );
            }}
          />
        </main>
      </div>

      {/* ── Click Detail Popup ── */}
      {popup && (
        <EventDetailPopup
          event={popup.event}
          x={popup.x}
          y={popup.y}
          resolveName={resolveName}
          fmt12h={fmt12h}
          typeBadge={TYPE_BADGE}
          onClose={() => setPopup(null)}
        />
      )}

      {showModal && (
        <AddEventModal
          selectedDate={selectedDate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
