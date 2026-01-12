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
  signInWithMagicLink: (email: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      // First check localStorage
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
          setIsLoading(false)
          return
        } catch (e) {
          console.error("Failed to load user from localStorage:", e)
        }
      }

      // Check if we're coming from auth callback (session might be fresh)
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("from_auth") === "true" || 
                       window.sessionStorage.getItem("auth_in_progress") === "true"

      // If no user in localStorage, check if there's an active Supabase session
      try {
        const { getSupabaseBrowser } = await import("@/lib/supabase-client")
        const supabase = getSupabaseBrowser()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log("[AuthContext] Found active Supabase session, fetching profile...")
          
          // Fetch user profile from API
          const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: session.user.id }),
          })

          if (response.ok) {
            const { user: userData } = await response.json()
            const userObj: User = {
              id: userData.id,
              email: userData.email,
              name: userData.name || userData.email.split("@")[0],
              role: userData.role || "CUSTOMER",
            }

            localStorage.setItem("user", JSON.stringify(userObj))
            setUser(userObj)
            console.log("[AuthContext] User authenticated from Supabase session")
            
            // Clear auth in progress flag
            window.sessionStorage.removeItem("auth_in_progress")
          }
        }
      } catch (error) {
        console.error("[AuthContext] Error checking Supabase session:", error)
      }

      setIsLoading(false)
    }

    initAuth()

    // Listen for storage events (for cross-tab auth and callback handler)
    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem("user")
      if (updatedUser) {
        try {
          setUser(JSON.parse(updatedUser))
        } catch (e) {
          console.error("Failed to load updated user:", e)
        }
      } else {
        setUser(null)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
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

  const signInWithMagicLink = async (email: string) => {
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send magic link")
      }

      return await response.json()
    } catch (err) {
      console.error("[v0] Magic link error:", err)
      throw err
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send password reset email")
      }

      return await response.json()
    } catch (err) {
      console.error("[v0] Password reset error:", err)
      throw err
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update password")
      }

      return await response.json()
    } catch (err) {
      console.error("[v0] Password update error:", err)
      throw err
    }
  }

  const signOut = () => {
    trackSignOut()
    localStorage.removeItem("user")
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signIn, signUp, signInWithMagicLink, resetPassword, updatePassword, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
