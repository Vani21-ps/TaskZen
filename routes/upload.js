import express from "express"
import multer from "multer"
import cloudinary from "../config/cloudinary.js"
import { CloudinaryStorage } from "multer-storage-cloudinary"
import auth from "../middleware/auth.js"

const router = express.Router()

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "taskzen_uploads", // Folder in Cloudinary
    format: async (req, file) => "png", // supports promises as well
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
})

const parser = multer({ storage: storage })

// Route to handle image upload
router.post("/", auth, parser.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." })
  }
  // req.file contains the uploaded file information from Cloudinary
  res.status(200).json({
    message: "Image uploaded successfully",
    public_id: req.file.filename,
    url: req.file.path,
  })
})

export default router
