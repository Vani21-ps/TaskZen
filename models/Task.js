import mongoose from "mongoose"

const TaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    dueDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Overdue"],
      default: "Pending",
    },
    category: {
      type: String,
      trim: true,
    },
    image: {
      public_id: String,
      url: String,
    },
  },
  {
    timestamps: true,
  },
)

// Middleware to update status to 'Overdue' if dueDate is in the past and status is not 'Completed'
TaskSchema.pre("save", function (next) {
  if (this.dueDate && this.dueDate < new Date() && this.status !== "Completed") {
    this.status = "Overdue"
  }
  next()
})

const Task = mongoose.models.Task || mongoose.model("Task", TaskSchema)

export default Task
