"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, useCallback } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface User {
  id: string
  username: string
  email: string
  token: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string) => void
  logout: () => void
  updateProfile: (data: { username?: string; email?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const API_BASE_URL = "http://localhost:5001/api/auth"

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("user")
    delete axios.defaults.headers.common["Authorization"]
    toast.success("Logged out successfully!")
    router.push("/login")
  }, [router])

  const loadUserFromLocalStorage = useCallback(() => {
    try {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser)
        setUser(parsedUser)
        axios.defaults.headers.common["Authorization"] = `Bearer ${parsedUser.token}`
      }
    } catch (error) {
      console.error("Failed to load user from local storage:", error)
      localStorage.removeItem("user") // Clear corrupted data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUserFromLocalStorage()
  }, [loadUserFromLocalStorage])

  const login = useCallback(
    (token: string) => {
      axios
        .get(`${API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          const userData = { ...response.data, token }
          setUser(userData)
          localStorage.setItem("user", JSON.stringify(userData))
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
          console.log("Axios default Authorization header set:", axios.defaults.headers.common["Authorization"])
          toast.success("Logged in successfully!")
          router.push("/")
        })
        .catch((error) => {
          console.error("Failed to fetch user data after login:", error.response?.data || error.message)
          toast.error("Login successful, but failed to load user data.")
          logout()
        })
    },
    [router, API_BASE_URL, logout],
  )

  const updateProfile = useCallback(
    async (data: { username?: string; email?: string }) => {
      if (!user) throw new Error("User not logged in.")
      try {
        const response = await axios.put(`${API_BASE_URL}/profile`, data, {
          headers: { Authorization: `Bearer ${user.token}` },
        })
        const updatedUser = { ...user, ...response.data.user }
        setUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
        toast.success("Profile updated successfully!")
      } catch (error: any) {
        console.error("Failed to update profile:", error)
        throw new Error(error.response?.data?.message || "Failed to update profile.")
      }
    },
    [user, API_BASE_URL],
  )

  return <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
