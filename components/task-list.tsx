"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import { useAuth } from "@/context/Auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, CheckCircle, Clock, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskForm } from "./task-form"
import toast from "react-hot-toast"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox" // Import Checkbox

interface Task {
  _id: string
  title: string
  description?: string
  dueDate?: string
  priority: "Low" | "Medium" | "High"
  status: "Pending" | "In Progress" | "Completed" | "Overdue"
  category?: string
  image?: {
    url: string
    public_id: string
  }
}

interface TaskListProps {
  categoryFilter?: string
  onTaskChange?: () => void
}

const API_BASE_URL = "http://localhost:5001/api/tasks"

export function TaskList({ categoryFilter, onTaskChange }: TaskListProps) {
  const { user, logout } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const params = categoryFilter ? { category: categoryFilter } : {}
      const response = await axios.get<Task[]>(API_BASE_URL, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        params: params,
      })
      setTasks(response.data)
    } catch (err: any) {
      console.error("Error fetching tasks:", err)
      const errorMessage = err.response?.data?.message || "Failed to load tasks."
      setError(errorMessage)
      toast.error(errorMessage)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout()
      }
    } finally {
      setLoading(false)
    }
  }, [user, logout, categoryFilter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string, public_id?: string) => {
    if (!user) return

    if (!window.confirm("Are you sure you want to delete this task?")) {
      return
    }

    try {
      await axios.delete(`${API_BASE_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        data: { public_id },
      })
      toast.success("Task deleted successfully!")
      fetchTasks()
      onTaskChange?.()
    } catch (err: any) {
      console.error("Error deleting task:", err)
      const errorMessage = err.response?.data?.message || "Failed to delete task."
      toast.error(errorMessage)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout()
      }
    }
  }

  const handleMarkAsCompleted = async (task: Task) => {
    if (!user) return

    // Toggle status: if completed, set to pending; otherwise, set to completed
    const newStatus = task.status === "Completed" ? "Pending" : "Completed"

    try {
      await axios.put(
        `${API_BASE_URL}/${task._id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      )
      toast.success(`Task "${task.title}" marked as ${newStatus}!`)
      fetchTasks()
      onTaskChange?.()
    } catch (err: any) {
      console.error("Error marking task as completed:", err)
      const errorMessage = err.response?.data?.message || "Failed to update task status."
      toast.error(errorMessage)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout()
      }
    }
  }

  const handleTaskFormClose = () => {
    setEditingTask(null)
    setIsFormOpen(false)
    fetchTasks()
    onTaskChange?.()
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-lg text-muted-foreground">
        Loading tasks...
      </div>
    )
  }

  if (error) {
    return <div className="flex min-h-[300px] items-center justify-center text-lg text-red-500">Error: {error}</div>
  }

  if (tasks.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-lg text-muted-foreground">
        No tasks found {categoryFilter ? `for category "${categoryFilter}"` : ""}. Add a new task to get started!
      </div>
    )
  }

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "Overdue":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "Pending":
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "High":
        return "text-red-600 dark:text-red-400"
      case "Medium":
        return "text-yellow-600 dark:text-yellow-400"
      case "Low":
        return "text-green-600 dark:text-green-400"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <Card
          key={task._id}
          className={cn("relative", {
            "opacity-70": task.status === "Completed",
          })}
        >
          {task.status === "Completed" && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg z-10">
              <span className="text-2xl font-bold text-green-500">COMPLETED</span>
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`task-${task._id}`}
                checked={task.status === "Completed"}
                onCheckedChange={() => handleMarkAsCompleted(task)}
                disabled={loading} // Disable checkbox while loading
              />
              <CardTitle
                className={cn("text-lg font-semibold", {
                  "line-through": task.status === "Completed",
                })}
              >
                <label htmlFor={`task-${task._id}`} className="cursor-pointer">
                  {task.title}
                </label>
              </CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* Explicitly pass ref to Button when used with asChild */}
                <Button variant="ghost" size="icon" className="w-8 h-8" ref={null}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {task.status !== "Completed" && (
                  <DropdownMenuItem onClick={() => handleMarkAsCompleted(task)}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleEdit(task)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDelete(task._id, task.image?.public_id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="space-y-2">
            {task.image?.url && (
              <div className="relative w-full h-32 rounded-md overflow-hidden mb-2">
                <Image
                  src={task.image.url || "/placeholder.svg"}
                  alt={task.title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
              </div>
            )}
            {task.description && (
              <p
                className={cn("text-sm text-muted-foreground", {
                  "line-through": task.status === "Completed",
                })}
              >
                {task.description}
              </p>
            )}
            <div className="flex items-center text-sm text-muted-foreground">
              {getStatusIcon(task.status)}
              <span className="ml-2">{task.status}</span>
            </div>
            {task.dueDate && (
              <div className="text-sm text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</div>
            )}
            <div className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>Priority: {task.priority}</div>
            {task.category && <div className="text-sm text-muted-foreground">Category: {task.category}</div>}
          </CardContent>
        </Card>
      ))}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <DialogContent className="sm:max-w-[425px] bg-popover text-popover-foreground z-[50]">

          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
          </DialogHeader>
          <TaskForm task={editingTask} onTaskChange={handleTaskFormClose} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

