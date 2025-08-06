"use client"

import { useState } from "react"
import { TaskList } from "@/components/task-list"
import { TaskForm } from "@/components/task-form"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/context/Auth/AuthContext" // Corrected import path
import { useSearchParams } from "next/navigation"

export default function TasksPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refreshTasks, setRefreshTasks] = useState(0)
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const categoryFilter = searchParams.get("category")

  const handleTaskChange = () => {
    // Renamed from handleTaskCreated
    setIsFormOpen(false)
    setRefreshTasks((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-lg text-muted-foreground">
        Loading tasks...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-lg text-muted-foreground">
        Please log in to view and manage your tasks.
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{categoryFilter ? `${categoryFilter} Tasks` : "My Tasks"}</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <TaskForm onTaskChange={handleTaskChange} /> {/* Pass onTaskChange */}
          </DialogContent>
        </Dialog>
      </div>
      <TaskList key={refreshTasks} categoryFilter={categoryFilter || undefined} onTaskChange={handleTaskChange} />{" "}
      {/* Pass onTaskChange */}
    </div>
  )
}
