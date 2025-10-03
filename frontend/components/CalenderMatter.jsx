"use client";

import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventApi } from "@fullcalendar/core";
import { FaCalendarAlt } from "react-icons/fa";




export default function MatterCalendar() {
  const [currentEvents, setCurrentEvents] = useState([]);

  const handleDateSelect = (selectInfo) => {
    const title = prompt("Enter event title");
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    if (title) {
      calendarApi.addEvent({
        id: String(Date.now()),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
      });
    }
  };

  const handleEventClick = (clickInfo) => {
    if (window.confirm(`Delete event '${clickInfo.event.title}'?`)) {
      clickInfo.event.remove();
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-md border border-purple-200 p-6 max-w-6xl mx-auto mb-8">
      <h3 className="text-2xl font-semibold text-purple-900 mb-4 flex items-center gap-2">
        <FaCalendarAlt className="text-purple-500" />
        Case Calendar
      </h3>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        initialView="dayGridMonth"
        editable
        selectable
        selectMirror
        dayMaxEvents
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventsSet={(events) => setCurrentEvents(events)}
        initialEvents={[
          {
            id: "1",
            title: "Meeting with Mr. Sam",
            start: new Date().toISOString().split("T")[0],
          },
          {
            id: "1",
            title: "Meeting with Mr. Martin",
            start: new Date().toISOString().split("T")[0],
          },
        ]}
        height="auto"
        eventColor="#a78bfa" // Light purple
        contentHeight="auto"
      />
    </section>
  );
}

