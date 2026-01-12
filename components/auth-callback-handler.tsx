"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import type { User } from "@/lib/auth-context"

/**
 * Component that handles auth callbacks from email links
 * Should be included in the root layout to handle tokens from URL
 */
export function AuthCallbackHandler() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const hasProcessed = useRef(false)

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Prevent double processing
      if (hasProcessed.current) {
        console.log("[AuthCallbackHandler] Already processed, skipping")
        return
      }

      // Debug logging
      console.log("[AuthCallbackHandler] Running, URL:", window.location.href)
      console.log("[AuthCallbackHandler] Hash:", window.location.hash)
      console.log("[AuthCallbackHandler] Search:", window.location.search)
      
      // Check for implicit flow (access_token in hash - older method)
      // Note: PKCE flow (code parameter) is handled server-side at /auth/callback route
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const searchParams = new URLSearchParams(window.location.search)
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")
      const type = hashParams.get("type")

      // Also check query params for access_token (fallback)
      const accessTokenQuery = searchParams.get("access_token")
      const refreshTokenQuery = searchParams.get("refresh_token")
      const typeQuery = searchParams.get("type")

      const token = accessToken || accessTokenQuery
      const refresh = refreshToken || refreshTokenQuery
      const authType = type || typeQuery

      console.log("[AuthCallbackHandler] Token found:", !!token)
      console.log("[AuthCallbackHandler] Auth type:", authType)
      console.log("[AuthCallbackHandler] Has processed:", hasProcessed.current)

      if (token && !hasProcessed.current) {
        hasProcessed.current = true
        setIsProcessing(true)
        console.log("[AuthCallbackHandler] Starting auth process (implicit flow):", { type: authType })

        try {
          const supabase = getSupabaseBrowser()
          
          // Set the session using the tokens (implicit flow)
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: refresh || "",
          })

          if (sessionError) {
            console.error("Session error:", sessionError)
            throw sessionError
          }

          if (sessionData.user) {
            // Fetch user profile from our API
            const response = await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: sessionData.user.id }),
            })

            if (response.ok) {
              const { user } = await response.json()
              const userData: User = {
                id: user.id,
                email: user.email,
                name: user.name || user.email.split("@")[0],
                role: user.role || "CUSTOMER",
              }

              // Store in localStorage and context
              localStorage.setItem("user", JSON.stringify(userData))
              
              // Trigger a storage event to update AuthContext
              window.dispatchEvent(new Event("storage"))

              // Clean up URL
              const cleanUrl = window.location.pathname
              window.history.replaceState({}, document.title, cleanUrl)

              // Show success message and redirect
              if (authType === "recovery") {
                // Redirect to password reset page
                console.log("[AuthCallbackHandler] Recovery flow - redirecting to reset password")
                router.push("/auth/reset-password?verified=true")
              } else if (authType === "magiclink" || authType === "signup") {
                // Magic link or signup - redirect based on role
                console.log("[AuthCallbackHandler] Magic link flow - redirecting based on role:", user.role)
                if (user.role === "ADMIN" || user.role === "SUPERADMIN") {
                  router.push("/admin")
                } else {
                  router.push("/")
                }
              } else {
                // Default redirect
                router.push("/")
              }
            } else {
              throw new Error("Failed to fetch user profile")
            }
          }
        } catch (error) {
          console.error("Auth callback error:", error)
          // Clean up URL even on error
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)
          
          // Show error (you might want to show a toast notification here)
          alert("Authentication failed. Please try again.")
        } finally {
          setIsProcessing(false)
        }
      }
    }

    handleAuthCallback()
  }, [router])

  // Show nothing - this is just a handler
  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-900">Signing you in...</p>
        </div>
      </div>
    )
  }

  return null
}
