"use client"

import { Label } from "@/components/ui/label"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"
import { useAuth } from "@/context/Auth/AuthContext" // Corrected import path
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, UploadCloud } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import Image from "next/image"

// Define the schema for task form validation
const taskFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  description: z.string().optional(),
  dueDate: z.date().optional().nullable(),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  status: z.enum(["Pending", "In Progress", "Completed", "Overdue"]).default("Pending"),
  category: z.string().optional(),
  image: z.any().optional(), // For file object or URL string
})

interface TaskFormProps {
  task?: any // Optional task object for editing
  onTaskChange?: () => void // Renamed from onTaskCreated
}

const API_BASE_URL = "http://localhost:5001/api/tasks"
const UPLOAD_API_URL = "http://localhost:5001/api/upload"

export function TaskForm({ task, onTaskChange }: TaskFormProps) {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(task?.image?.url || null)
  const [imagePublicId, setImagePublicId] = useState<string | null>(task?.image?.public_id || null)

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      dueDate: task?.dueDate ? new Date(task.dueDate) : null,
      priority: task?.priority || "Medium",
      status: task?.status || "Pending",
      category: task?.category || "",
      image: null, // Reset image input for new task or editing
    },
  })

  // Update form fields when task prop changes (for editing)
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        priority: task.priority,
        status: task.status,
        category: task.category,
        image: null, // Keep image input clear, use imageUrl for display
      })
      setImageUrl(task.image?.url || null)
      setImagePublicId(task.image?.public_id || null)
    } else {
      form.reset({
        title: "",
        description: "",
        dueDate: null,
        priority: "Medium",
        status: "Pending",
        category: "",
        image: null,
      })
      setImageUrl(null)
      setImagePublicId(null)
    }
  }, [task, form])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      form.setValue("image", file)
      setImageUrl(URL.createObjectURL(file)) // Show preview
    } else {
      form.setValue("image", null)
      setImageUrl(null)
    }
  }

  const handleRemoveImage = () => {
    form.setValue("image", null)
    setImageUrl(null)
    setImagePublicId(null) // Clear public ID as well
  }

  async function onSubmit(values: z.infer<typeof taskFormSchema>) {
    if (!user) {
      toast.error("You must be logged in to perform this action.")
      logout()
      return
    }

    setLoading(true)
    let uploadedImageUrl = imageUrl
    let uploadedImagePublicId = imagePublicId

    try {
      // If a new image file is selected, upload it
      if (values.image instanceof File) {
        const formData = new FormData()
        formData.append("image", values.image)

        const uploadResponse = await axios.post(UPLOAD_API_URL, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${user.token}`,
          },
        })
        uploadedImageUrl = uploadResponse.data.url
        uploadedImagePublicId = uploadResponse.data.public_id
      } else if (values.image === null && imageUrl !== null) {
        // If image was removed, but there was an existing one
        uploadedImageUrl = null
        uploadedImagePublicId = null
      }

      const taskData = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        image: uploadedImageUrl ? { url: uploadedImageUrl, public_id: uploadedImagePublicId } : undefined,
      }

      if (taskData.image === undefined) {
        delete taskData.image // Ensure image field is not sent if undefined
      }

      if (task) {
        // Update existing task
        await axios.put(`${API_BASE_URL}/${task._id}`, taskData, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })
        toast.success("Task updated successfully!")
      } else {
        // Create new task
        await axios.post(API_BASE_URL, taskData, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        })
        toast.success("Task created successfully!")
        form.reset() // Clear form for new task
        setImageUrl(null)
        setImagePublicId(null)
      }
      onTaskChange?.() // Call callback to refresh list/close dialog
    } catch (err: any) {
      console.error("Task form submission error:", err)
      const errorMessage = err.response?.data?.message || "Failed to save task."
      toast.error(errorMessage)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Task title" {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Task description (optional)" {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      disabled={loading}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Work, Personal" {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel>Task Image (Optional)</FormLabel>
          <FormControl>
            <div className="flex items-center space-x-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={loading}
              />
              <Label
                htmlFor="image"
                className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
              >
                <UploadCloud className="mr-2 h-5 w-5" />
                {imageUrl ? "Change Image" : "Upload Image"}
              </Label>
              {imageUrl && (
                <div className="relative w-24 h-24 rounded-md overflow-hidden shrink-0">
                  <Image src={imageUrl || "/placeholder.svg"} alt="Task preview" layout="fill" objectFit="cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full"
                    onClick={handleRemoveImage}
                    disabled={loading}
                  >
                    X
                  </Button>
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (task ? "Saving..." : "Creating...") : task ? "Save Changes" : "Create Task"}
        </Button>
      </form>
    </Form>
  )
}
