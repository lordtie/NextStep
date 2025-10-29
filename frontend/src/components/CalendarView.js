import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { API_URL } from "../config";
export default function CalendarView({ tasks }) {
  const [date, setDate] = useState(new Date());

  const tasksForDate = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const taskDate = new Date(t.dueDate);
    return taskDate.toDateString() === date.toDateString();
  });

  return (
    <div>
      <h2>Calendar</h2>
      <Calendar onChange={setDate} value={date} />
      <div>
        <h3>Tasks for {date.toDateString()}:</h3>
        {tasksForDate.length === 0 ? (
          <p>No tasks on this date</p>
        ) : (
          <ul>
            {tasksForDate.map((t) => (
              <li key={t.id}>
                {t.title} - {t.status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
