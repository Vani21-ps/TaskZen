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
    <div className="container mx-auto py-8 h-[calc(100vh-100px)] flex flex-col">
      <h1 className="text-3xl font-bold mb-6">My Calendar</h1>
      <div className="flex-1">
        <CalendarView />
      </div>
    </div>
  )
}
