"use client"

import { CalendarView } from "@/components/calendar-view"
import { useAuth } from "@/context/Auth/AuthContext"

export default function CalendarPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-lg text-muted-foreground">
        Loading calendar...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-lg text-muted-foreground">
        Please log in to view your calendar.
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex justify-center items-start px-4 py-10">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center">My Calendar</h1>
        <CalendarView />
      </div>
    </div>
  )
}
