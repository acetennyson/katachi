"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

/**
 * Shows a loading screen when coming from auth callback
 * Displays while the AuthContext is loading the session
 */
export function AuthLoadingScreen() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if we're coming from auth callback
    const fromAuth = searchParams.get("from_auth") === "true"
    
    if (fromAuth) {
      // Set flag in sessionStorage so we know auth is in progress
      window.sessionStorage.setItem("auth_in_progress", "true")
      setShow(true)
      
      // Auto-hide after 5 seconds (fallback in case something goes wrong)
      const timeout = setTimeout(() => {
        setShow(false)
        window.sessionStorage.removeItem("auth_in_progress")
      }, 5000)
      
      return () => clearTimeout(timeout)
    }
  }, [searchParams])

  // Also check sessionStorage on mount
  useEffect(() => {
    if (window.sessionStorage.getItem("auth_in_progress") === "true") {
      setShow(true)
    }
    
    // Listen for user being loaded
    const checkAuth = setInterval(() => {
      const user = localStorage.getItem("user")
      if (user) {
        setShow(false)
        window.sessionStorage.removeItem("auth_in_progress")
      }
    }, 200)
    
    return () => clearInterval(checkAuth)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-neutral-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-neutral-900 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Signing you in...</h2>
        <p className="text-neutral-600">Please wait a moment</p>
      </div>
    </div>
  )
}
