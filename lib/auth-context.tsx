"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { trackSignIn, trackSignUp, trackSignOut } from "@/lib/analytics"

export interface User {
  id: string
  email: string
  name: string
  role: "CUSTOMER" | "ADMIN" | "SUPPORT" | "SUPERADMIN"
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Failed to load user:", e)
      }
    }
    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("response", data.user);
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || email.split("@")[0],
          role: data.user.role || "CUSTOMER",
        }
        localStorage.setItem("user", JSON.stringify(userData))
        setUser(userData)
        trackSignIn(userData.id)
      } else {
        throw new Error("Invalid credentials")
      }
    } catch (err) {
      console.error("[v0] Signin error:", err)
      throw err
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      if (response.ok) {
        const data = await response.json()
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || name,
          role: data.user.role || "CUSTOMER",
        }
        localStorage.setItem("user", JSON.stringify(userData))
        setUser(userData)
        trackSignUp(userData.id)
      } else {
        throw new Error("Signup failed")
      }
    } catch (err) {
      console.error("[v0] Signup error:", err)
      throw err
    }
  }

  const signOut = () => {
    trackSignOut()
    localStorage.removeItem("user")
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
