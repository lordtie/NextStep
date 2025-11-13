// frontend/src/pages/Calendar.jsx
import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

// ✅ Our custom polish for FullCalendar
import "../styles/calendar.css";

import { eventsApi } from "../lib/eventsApi";
import EventDialog from "../components/calendar/EventDialog";

export default function CalendarPage() {
  const calendarRef = React.useRef(null);
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [activeEvent, setActiveEvent] = React.useState(null);

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      const data = await eventsApi.list();
      if (!cancel) {
        setEvents(normalize(data));
        setLoading(false);
      }
    })();
    return () => (cancel = true);
  }, []);

  function normalize(arr) {
    return (arr || []).map((e) => ({
      id: e.id,
      title: e.title || "Untitled event",
      start: e.start ? new Date(e.start) : null,
      end: e.end ? new Date(e.end) : null,
      allDay: !!e.allDay,
      extendedProps: {
        location: e.location || "",
        description: e.description || "",
      },
    }));
  }

  function openCreate({ start, end, allDay }) {
    setActiveEvent({ start, end, allDay });
    setDialogOpen(true);
  }

  function openEdit(clickInfo) {
    const { event } = clickInfo;
    setActiveEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      location: event.extendedProps?.location || "",
      description: event.extendedProps?.description || "",
    });
    setDialogOpen(true);
  }

  async function handleSave(evt) {
    const payload = {
      title: evt.title,
      location: evt.location,
      description: evt.description,
      start: evt.start,
      end: evt.end,
      allDay: !!evt.allDay,
    };

    if (evt.id) {
      const updated = await eventsApi.update(evt.id, payload);
      if (updated) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === evt.id
              ? {
                  ...e,
                  title: updated.title,
                  start: new Date(updated.start),
                  end: new Date(updated.end),
                  allDay: !!updated.allDay,
                  extendedProps: {
                    location: updated.location || "",
                    description: updated.description || "",
                  },
                }
              : e
          )
        );
      }
    } else {
      const created = await eventsApi.create(payload);
      setEvents((prev) =>
        prev.concat({
          id: created.id,
          title: created.title,
          start: new Date(created.start),
          end: new Date(created.end),
          allDay: !!created.allDay,
          extendedProps: {
            location: created.location || "",
            description: created.description || "",
          },
        })
      );
    }
    setDialogOpen(false);
    setActiveEvent(null);
  }

  async function handleDelete(id) {
    await eventsApi.remove(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setDialogOpen(false);
    setActiveEvent(null);
  }

  async function handleDrop(changeInfo) {
    const { event } = changeInfo; // drag & drop or resize
    await eventsApi.update(event.id, { start: event.start, end: event.end, allDay: event.allDay });
    setEvents((prev) =>
      prev.map((e) =>
        e.id === event.id ? { ...e, start: event.start, end: event.end, allDay: event.allDay } : e
      )
    );
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <button
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          onClick={() => calendarRef.current?.getApi().today()}
        >
          Today
        </button>
        <button
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          onClick={() => calendarRef.current?.getApi().prev()}
        >
          ‹
        </button>
        <button
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          onClick={() => calendarRef.current?.getApi().next()}
        >
          ›
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={() => calendarRef.current?.getApi().changeView("dayGridMonth")}
          >
            Month
          </button>
          <button
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={() => calendarRef.current?.getApi().changeView("timeGridWeek")}
          >
            Week
          </button>
          <button
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={() => calendarRef.current?.getApi().changeView("timeGridDay")}
          >
            Day
          </button>
          <button
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            onClick={() => calendarRef.current?.getApi().changeView("listWeek")}
          >
            Agenda
          </button>

          {loading && (
            <span className="ml-2 rounded-md bg-slate-200 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Loading…
            </span>
          )}
        </div>
      </div>

      <div className="calendar-card">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="timeGridWeek"
          expandRows={true}
          height="auto"
          contentHeight="auto"
          nowIndicator={true}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          slotDuration="00:30:00"
          allDaySlot={true}
          selectable={true}
          selectMirror={true}
          editable={true}
          eventResizableFromStart={true}
          eventResize={handleDrop}
          eventDrop={handleDrop}
          select={(info) => openCreate({ start: info.start, end: info.end, allDay: info.allDay })}
          eventClick={openEdit}
          events={events}
          dayMaxEventRows={3} // month view: show first 3 then +more
          headerToolbar={false}
          weekNumbers={false}
          eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: true }}
          // Slightly richer month/day rendering like Google:
          eventContent={(arg) => {
            const timeText = arg.timeText ? `${arg.timeText} ` : "";
            const loc = arg.event.extendedProps?.location;
            return {
              html: `<div class="truncate"><strong>${timeText}${escapeHtml(
                arg.event.title || ""
              )}</strong>${loc ? ` <span class="opacity-80">• ${escapeHtml(loc)}</span>` : ""}</div>`,
            };
          }}
          loading={(isLoading) => setLoading(isLoading)}
        />
      </div>

      <EventDialog
        open={dialogOpen}
        initial={activeEvent}
        onClose={() => {
          setDialogOpen(false);
          setActiveEvent(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
