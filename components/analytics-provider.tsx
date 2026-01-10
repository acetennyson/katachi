"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { trackPageView, trackSessionStart } from "@/lib/analytics"

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pageStartTime = useRef<number>(Date.now())
  const currentPage = useRef<string>(pathname)

  useEffect(() => {
    // Track session start on mount
    trackSessionStart()
  }, [])

  useEffect(() => {
    // Track page view with duration when route changes
    if (pathname) {
      // Calculate duration on previous page
      if (currentPage.current !== pathname) {
        const duration = Math.round((Date.now() - pageStartTime.current) / 1000)
        
        // Send duration for previous page if it was viewed for more than 1 second
        if (duration > 1 && currentPage.current) {
          trackPageDuration(currentPage.current, duration)
        }
      }

      // Track new page view
      trackPageView(pathname, document.title)
      
      // Reset timer for new page
      pageStartTime.current = Date.now()
      currentPage.current = pathname
    }
  }, [pathname])

  // Track duration when user leaves (page unload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const duration = Math.round((Date.now() - pageStartTime.current) / 1000)
      if (duration > 1) {
        trackPageDuration(currentPage.current, duration)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  return <>{children}</>
}

// Helper function to track page duration
function trackPageDuration(page: string, durationSeconds: number) {
  if (typeof window === "undefined") return
  
  try {
    fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "page_duration",
        payload: {
          page,
          duration: durationSeconds,
        },
        sessionId: sessionStorage.getItem("analytics_session_id") || "",
        deviceId: localStorage.getItem("analytics_device_id") || "",
      }),
      // Use keepalive to ensure request completes even if page is closing
      keepalive: true,
    })
  } catch (error) {
    console.error("Failed to track page duration:", error)
  }
}

