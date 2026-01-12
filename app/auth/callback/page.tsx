"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Alternative callback page for Supabase auth
 * This can be used as a dedicated callback URL
 */
export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // The AuthCallbackHandler in the layout will handle the actual token processing
    // This page just provides a landing spot and redirects home
    const timer = setTimeout(() => {
      router.push("/")
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
        <p className="text-neutral-900 text-lg">Completing authentication...</p>
      </div>
    </div>
  )
}
