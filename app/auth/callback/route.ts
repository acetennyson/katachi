import { getSupabaseServer } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { type NextRequest } from "next/server"

/**
 * Server-side auth callback handler for PKCE flow
 * This exchanges the code for a session on the server side
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"

  console.log("[Auth Callback Route] Code:", !!code)
  console.log("[Auth Callback Route] Next:", next)

  if (code) {
    try {
      const supabase = await getSupabaseServer()

      // Exchange code for session (server-side)
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("[Auth Callback Route] Exchange error:", error)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        )
      }

      if (data.user) {
        console.log("[Auth Callback Route] Session established for user:", data.user.id)

        // Fetch user role from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()

        // Redirect based on role or next parameter
        if (profile?.role === "ADMIN" || profile?.role === "SUPERADMIN") {
          return NextResponse.redirect(new URL("/admin", requestUrl.origin))
        } else {
          return NextResponse.redirect(new URL(next, requestUrl.origin))
        }
      }
    } catch (error) {
      console.error("[Auth Callback Route] Unexpected error:", error)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=Authentication failed`, requestUrl.origin)
      )
    }
  }

  // No code provided, redirect to signin
  return NextResponse.redirect(new URL("/auth/signin", requestUrl.origin))
}
