"use client";

import { CalendarEvent } from "../types/event";

interface Props {
  event: CalendarEvent;
  x: number;
  y: number;
  resolveName: (id: string) => string;
  fmt12h: (t: string) => string;
  typeBadge: Record<string, { label: string; color: string }>;
  onClose: () => void;
}

export default function EventDetailPopup({ event, x, y, resolveName, fmt12h, typeBadge, onClose }: Props) {
  const badge = typeBadge[event.event_type] ?? { label: event.event_type, color: "#6b7280" };
  const isAssigned = !!event.assigned_to;
  const createdDate = new Date(event.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div
      className="fixed z-50 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Colour bar + close */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: isAssigned ? "#34a853" : badge.color }}
      >
        <span className="text-[11px] font-semibold text-white/90 uppercase tracking-wide">
          {badge.label}
          {isAssigned && " · Assigned"}
        </span>
        <button
          onClick={onClose}
          className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white text-xs transition"
        >
          ✕
        </button>
      </div>

      <div className="px-4 py-3 space-y-2.5">
        {/* Title */}
        <p className="text-sm font-bold text-gray-900 leading-snug">{event.title}</p>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-gray-500 leading-relaxed">{event.description}</p>
        )}

        <div className="space-y-1.5 border-t border-gray-100 pt-2.5">
          {/* Date */}
          {event.event_date && (
            <Row icon={<CalIcon />}>
              {new Date(event.event_date + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric",
              })}
            </Row>
          )}

          {/* Time */}
          {event.start_time && (
            <Row icon={<ClockIcon />}>
              {fmt12h(event.start_time)}
              {event.end_time && <> &ndash; {fmt12h(event.end_time)}</>}
            </Row>
          )}

          {/* Created by */}
          <Row icon={<PersonIcon />}>
            <span className="text-gray-400 mr-1">By</span>
            <span className="font-medium text-gray-800">{resolveName(event.created_by)}</span>
          </Row>

          {/* Assigned to */}
          {event.assigned_to && (
            <Row icon={<GroupIcon className="text-green-500" />}>
              <span className="text-gray-400 mr-1">To</span>
              <span className="font-semibold text-green-600">{resolveName(event.assigned_to)}</span>
            </Row>
          )}

          {/* Created at */}
          <Row icon={<InfoIcon />}>
            <span className="text-gray-400">Created {createdDate}</span>
          </Row>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs text-gray-600">
      <span className="w-3.5 h-3.5 shrink-0 mt-0.5">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  );
}

function GroupIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`w-3.5 h-3.5 ${className ?? ""}`}>
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>
  );
}
