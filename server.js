import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import authRoutes from "./routes/auth.js"
import taskRoutes from "./routes/tasks.js"
import uploadRoutes from "./routes/upload.js"

dotenv.config() // Load environment variables first

const app = express()
const PORT = process.env.PORT || 5001

// Log MONGO_URI to confirm it's loaded
console.log("Attempting to connect to MongoDB with URI:", process.env.MONGO_URI ? "URI loaded" : "URI UNDEFINED")

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err.message))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/tasks", taskRoutes)
app.use("/api/upload", uploadRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
