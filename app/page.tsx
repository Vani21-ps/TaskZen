"use client"

import { useState } from "react"
import { ProductivityDashboard } from "@/components/productivity-dashboard"
import { AIChatbot } from "@/components/ai-chatbot"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TaskForm } from "@/components/task-form"
import { useAuth } from "@/context/Auth/AuthContext" // Corrected import path
import { TaskList } from "@/components/task-list" // Import TaskList

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refreshDashboard, setRefreshDashboard] = useState(0)

  const handleTaskChange = () => {
    // Renamed from handleTaskCreated
    setIsFormOpen(false)
    setRefreshDashboard((prev) => prev + 1) // Increment to trigger dashboard and task list refresh
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-lg text-muted-foreground">
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {user && (
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
        )}
      </div>

      {user ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProductivityDashboard key={refreshDashboard} />
          </div>
          <div className="lg:col-span-1">
            <AIChatbot />
          </div>
          {/* New section for TaskList on the Dashboard */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Your Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <TaskList key={`dashboard-tasks-${refreshDashboard}`} onTaskChange={handleTaskChange} />{" "}
                {/* Pass onTaskChange */}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="flex flex-col h-[500px] items-center justify-center text-lg text-muted-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to TaskZen!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p>Please log in or sign up to access your productivity dashboard and AI assistant.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

