import express from "express"
import Task from "../models/Task.js"
import auth from "../middleware/auth.js"
import cloudinary from "../config/cloudinary.js"
import { format, subDays } from "date-fns"
import mongoose from "mongoose" // Import mongoose to access ObjectId

const router = express.Router()

// Create a new task
router.post("/", auth, async (req, res) => {
  console.log("Received request to create new task:", req.body)
  try {
    const newTask = new Task({
      userId: req.user.id,
      ...req.body,
    })
    const task = await newTask.save()
    console.log("New task saved to DB:", task)
    res.status(201).json(task)
  } catch (err) {
    console.error("Error saving new task:", err.message)
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// Get all tasks for a user (with optional category filter)
router.get("/", auth, async (req, res) => {
  try {
    const { category } = req.query // Get category from query parameters
    const filter = { userId: req.user.id }

    if (category) {
      // Use a regular expression for case-insensitive matching
      filter.category = { $regex: new RegExp(category, "i") }
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 })
    res.json(tasks)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// Get a single task by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id })
    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }
    res.json(task)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// Update a task
router.put("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id })
    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Handle image deletion if a new image is uploaded or existing one is removed
    if (req.body.image === null && task.image && task.image.public_id) {
      // Image was explicitly removed from the form
      await cloudinary.uploader.destroy(task.image.public_id)
      task.image = undefined // Remove image field from task
    } else if (
      req.body.image &&
      req.body.image.public_id &&
      task.image &&
      task.image.public_id !== req.body.image.public_id
    ) {
      // New image uploaded, delete old one
      await cloudinary.uploader.destroy(task.image.public_id)
    }

    // Update task fields
    Object.assign(task, req.body)

    await task.save()
    res.json(task)
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// Delete a task
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id })
    if (!task) {
      return res.status(404).json({ message: "Task not found" })
    }

    // Delete image from Cloudinary if it exists
    if (task.image && task.image.public_id) {
      await cloudinary.uploader.destroy(task.image.public_id)
    }

    await Task.deleteOne({ _id: req.params.id }) // Use deleteOne on the model
    res.json({ message: "Task removed" })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

// Get task status distribution
router.get("/stats/status-distribution", auth, async (req, res) => {
  try {
    console.log("Fetching status distribution for userId:", req.user.id, "Type:", typeof req.user.id)
    const statusDistribution = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } }, // Convert to ObjectId
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1, _id: 0 } },
    ])
    console.log("Status distribution result:", statusDistribution)
    res.json(statusDistribution)
  } catch (err) {
    console.error("Error fetching status distribution:", err.message)
    res.status(500).send("Server error")
  }
})

// Get daily completion streak
router.get("/stats/daily-completion", auth, async (req, res) => {
  try {
    console.log("Fetching daily completion for userId:", req.user.id, "Type:", typeof req.user.id)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today

    const sevenDaysAgo = subDays(today, 6) // Go back 6 days from today to include today, making it 7 days total
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const dailyCompletion = await Task.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id), // Convert to ObjectId
          status: "Completed",
          updatedAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" },
          },
          completedTasks: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", completedTasks: 1, _id: 0 } },
    ])

    // Fill in dates with 0 completed tasks for the last 7 days
    const allDates = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i) // Iterate from 6 days ago up to today
      return format(d, "yyyy-MM-dd")
    })

    const result = allDates.map((date) => {
      const found = dailyCompletion.find((item) => item.date === date)
      return { date, completedTasks: found ? found.completedTasks : 0 }
    })
    console.log("Daily completion result:", result)
    res.json(result)
  } catch (err) {
    console.error("Error fetching daily completion:", err.message)
    res.status(500).send("Server error")
  }
})

// Get task category distribution
router.get("/stats/category-distribution", auth, async (req, res) => {
  try {
    console.log("Fetching category distribution for userId:", req.user.id, "Type:", typeof req.user.id)
    const categoryDistribution = await Task.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), category: { $ne: null, $ne: "" } } }, // Convert to ObjectId
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { category: "$_id", count: 1, _id: 0 } },
    ])
    console.log("Category distribution result:", categoryDistribution)
    res.json(categoryDistribution)
  } catch (err) {
    console.error("Error fetching category distribution:", err.message)
    res.status(500).send("Server error")
  }
})

export default router
