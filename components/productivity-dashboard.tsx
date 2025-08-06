"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Clock, XCircle, ListTodo } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "@/context/Auth/AuthContext"
import toast from "react-hot-toast"

// Define types for chart data
type StatusDistributionData = {
  status: string
  count: number
}

type DailyCompletionData = {
  date: string
  completedTasks: number
}

type CategoryDistributionData = {
  category: string
  count: number
}

const API_BASE_URL = "http://localhost:5001/api/tasks"

// New Pastel Color Palette
const PASTEL_COLORS = [
  "#A7D9F0", // Light Blue
  "#B2E8B2", // Light Green
  "#FFFACD", // Light Yellow
  "#FFD1DC", // Light Pink
  "#E0BBE4", // Light Purple
  "#FFDAB9", // Light Orange
  "#D3D3D3", // Light Grey
  "#B2EBF2", // Light Teal
]

export function ProductivityDashboard() {
  const { user, loading: authLoading, logout } = useAuth()
  const [totalTasks, setTotalTasks] = useState(0)
  const [completedTasks, setCompletedTasks] = useState(0)
  const [inProgressTasks, setInProgressTasks] = useState(0)
  const [overdueTasks, setOverdueTasks] = useState(0)
  const [statusDistribution, setStatusDistribution] = useState<StatusDistributionData[]>([])
  const [dailyCompletion, setDailyCompletion] = useState<DailyCompletionData[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistributionData[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setDataLoading(false)
        return
      }

      console.log("Fetching dashboard data for user:", user.email, "with token:", user.token ? "present" : "missing")
      setDataLoading(true)
      setError(null)

      try {
        const headers = {
          Authorization: `Bearer ${user.token}`,
        }

        // Fetch all tasks to calculate counts
        const tasksResponse = await axios.get<any[]>(API_BASE_URL, { headers })
        const allTasks = tasksResponse.data

        const total = allTasks.length
        const completed = allTasks.filter((task) => task.status === "Completed").length
        const inProgress = allTasks.filter((task) => task.status === "In Progress").length
        const overdue = allTasks.filter((task) => task.status === "Overdue").length

        setTotalTasks(total)
        setCompletedTasks(completed)
        setInProgressTasks(inProgress)
        setOverdueTasks(overdue)

        // Fetch status distribution
        const statusResponse = await axios.get<StatusDistributionData[]>(`${API_BASE_URL}/stats/status-distribution`, {
          headers,
        })
        setStatusDistribution(statusResponse.data)

        // Fetch daily completion
        const dailyCompletionResponse = await axios.get<DailyCompletionData[]>(
          `${API_BASE_URL}/stats/daily-completion`,
          { headers },
        )
        setDailyCompletion(dailyCompletionResponse.data)

        // Fetch category distribution
        const categoryResponse = await axios.get<CategoryDistributionData[]>(
          `${API_BASE_URL}/stats/category-distribution`,
          { headers },
        )
        setCategoryDistribution(categoryResponse.data)
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err)
        const errorMessage = err.response?.data?.message || "Failed to load dashboard data."
        setError(errorMessage)
        toast.error(errorMessage)

        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout()
        }
      } finally {
        setDataLoading(false)
      }
    }

    if (user && !authLoading) {
      fetchDashboardData()
    }
  }, [user, authLoading, logout])

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  if (authLoading || dataLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-lg text-muted-foreground">
        Loading Dashboard...
      </div>
    )
  }

  if (error) {
    return <div className="flex min-h-[300px] items-center justify-center text-lg text-red-500">Error: {error}</div>
  }

  if (!user) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-lg text-muted-foreground">
        Please log in to view your productivity dashboard.
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <ListTodo className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTasks}</div>
          <p className="text-xs text-muted-foreground">All tasks created</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedTasks}</div>
          <p className="text-xs text-muted-foreground">Successfully finished</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgressTasks}</div>
          <p className="text-xs text-muted-foreground">Currently working on</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overdueTasks}</div>
          <p className="text-xs text-muted-foreground">Past their deadline</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Overall Progress & Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={completionRate} className="h-3 flex-1" />
            <span className="text-sm font-medium">{completionRate.toFixed(0)}% Completed</span>
          </div>
          <Separator className="my-4" />

          {/* New grid layout for charts: 2 on top, 1 below */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Task Status Distribution */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Task Status Distribution</h3>
              <div className="h-80 w-full">
                {statusDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="status"
                        paddingAngle={3}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`status-cell-${index}`} fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No status data available.
                  </div>
                )}
              </div>
            </div>

            {/* Task Category Distribution */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Task Category Distribution</h3>
              <div className="h-80 w-full">
                {categoryDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="category"
                        paddingAngle={3}
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`category-cell-${index}`} fill={PASTEL_COLORS[index % PASTEL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No category data available.
                  </div>
                )}
              </div>
            </div>

            {/* Daily Completion Streak */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-2">Daily Completion Streak (Last 7 Days)</h3>
              <div className="h-80 w-full">
                {dailyCompletion.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyCompletion} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <XAxis dataKey="date" tickFormatter={(dateStr) => dateStr.slice(5)} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completedTasks" fill={PASTEL_COLORS[1]} name="Completed Tasks" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No daily completion data available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
