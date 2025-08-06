import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import auth from "../middleware/auth.js"

const router = express.Router()

// Register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body

  try {
    let user = await User.findOne({ email })
    if (user) {
      console.log(`Registration failed: User with email ${email} already exists.`) // Added log
      return res.status(400).json({ message: "User already exists" })
    }

    user = new User({
      username,
      email,
      password,
    })

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)

    await user.save()
    console.log(`User registered and saved to DB: ${user.id}`) // Added log

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) {
        console.error("JWT sign error during registration:", err.message) // Added log
        throw err
      }
      res.status(201).json({ message: "User registered successfully", token })
    })
  } catch (err) {
    console.error("Server error during registration:", err.message) // Added log
    res.status(500).send("Server error")
  }
})

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      console.log(`Login failed: User with email ${email} not found.`) // Added log
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for user ${email}.`) // Added log
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    }

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }, (err, token) => {
      if (err) {
        console.error("JWT sign error during login:", err.message) // Added log
        throw err
      }
      res.json({ message: "Logged in successfully", token })
    })
  } catch (err) {
    console.error("Server error during login:", err.message) // Added log
    res.status(500).send("Server error")
  }
})

// Get user profile (protected route)
router.get("/me", auth, async (req, res) => {
  try {
    console.log("Attempting to fetch user profile for ID:", req.user.id) // Added log
    const user = await User.findById(req.user.id).select("-password") // Exclude password
    if (!user) {
      console.log(`User profile not found for ID: ${req.user.id}`) // Added log
      return res.status(404).json({ message: "User not found" })
    }
    console.log("User profile fetched successfully:", user.email) // Added log
    res.json(user)
  } catch (err) {
    console.error("Server error fetching user profile:", err.message) // Added log
    res.status(500).send("Server error")
  }
})

// Update user profile (protected route)
router.put("/profile", auth, async (req, res) => {
  const { username, email } = req.body
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (username) user.username = username
    if (email) user.email = email

    await user.save()
    res.json({
      message: "Profile updated successfully",
      user: { id: user.id, username: user.username, email: user.email },
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send("Server error")
  }
})

export default router
