"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import axios from "axios";
import { useAuth } from "@/context/Auth/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskForm } from "./task-form";
import toast from "react-hot-toast";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/components/styles/calendar.css"; // ✅ Make sure path is correct

//import '@app/globals.css'; // ✅ Ensure this is imported for global styles
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TaskEvent {
  _id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Completed" | "Overdue";
  category?: string;
  image?: {
    url: string;
    public_id: string;
  };
}

const API_BASE_URL = "http://localhost:5001/api/tasks";

export function CalendarView() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskEvent | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>("month"); // ✅ Correct typing

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<any[]>(API_BASE_URL, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const formattedEvents: TaskEvent[] = response.data.map((task) => ({
        _id: task._id,
        title: task.title,
        start: task.dueDate ? new Date(task.dueDate) : new Date(),
        end: task.dueDate ? new Date(task.dueDate) : new Date(),
        description: task.description,
        priority: task.priority,
        status: task.status,
        category: task.category,
        image: task.image,
      }));
      setEvents(formattedEvents);
    } catch (err: any) {
      console.error("Error fetching tasks for calendar:", err);
      const errorMessage = err.response?.data?.message || "Failed to load calendar tasks.";
      setError(errorMessage);
      toast.error(errorMessage);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSelectEvent = (event: TaskEvent) => {
    setSelectedTask(event);
    setIsFormOpen(true);
  };

  const handleTaskFormClose = () => {
    setSelectedTask(null);
    setIsFormOpen(false);
    fetchTasks();
  };

  const eventPropGetter = useCallback((event: TaskEvent) => {
    let className = "";
    switch (event.priority) {
      case "High":
        className = "priority-High";
        break;
      case "Medium":
        className = "priority-Medium";
        break;
      case "Low":
        className = "priority-Low";
        break;
    }
    return { className };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-lg text-muted-foreground">
        Loading calendar...
      </div>
    );
  }

  if (error) {
    return <div className="flex min-h-[300px] items-center justify-center text-lg text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex justify-center items-start w-full">
  <div className="w-full max-w-screen-lg px-4">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%", minHeight: "600px" }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
          views={["month", "week", "day", "agenda"]}
          view={currentView}
          onView={(view) => setCurrentView(view)}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          popup
        />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedTask ? "Edit Task" : "Create New Task"}</DialogTitle>
            </DialogHeader>
            <TaskForm task={selectedTask} onTaskChange={handleTaskFormClose} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
