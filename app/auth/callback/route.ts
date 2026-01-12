import { getSupabaseServer } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { type NextRequest } from "next/server"

/**
 * Server-side auth callback handler for Supabase auth flows
 * Handles both:
 * 1. PKCE code exchange (code parameter)
 * 2. Token hash verification (coming from Supabase's verify endpoint)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next") || "/"

  console.log("[Auth Callback Route] Code:", !!code)
  console.log("[Auth Callback Route] Token hash:", !!token_hash)
  console.log("[Auth Callback Route] Type:", type)
  console.log("[Auth Callback Route] Next:", next)

  const supabase = await getSupabaseServer()

  // Handle PKCE code exchange
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("[Auth Callback Route] Code exchange error:", error)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        )
      }

      if (data.user) {
        console.log("[Auth Callback Route] Session established via code for user:", data.user.id)

        // Fetch user role from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()

        // Handle password recovery
        if (type === "recovery") {
          return NextResponse.redirect(new URL("/auth/reset-password?verified=true&from_auth=true", requestUrl.origin))
        }

        // Redirect based on role with auth flag for loading screen
        if (profile?.role === "ADMIN" || profile?.role === "SUPERADMIN") {
          return NextResponse.redirect(new URL("/admin?from_auth=true", requestUrl.origin))
        } else {
          return NextResponse.redirect(new URL(`${next}?from_auth=true`, requestUrl.origin))
        }
      }
    } catch (error) {
      console.error("[Auth Callback Route] Code exchange error:", error)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=Authentication failed`, requestUrl.origin)
      )
    }
  }

  // Handle token hash (from email verification links)
  if (token_hash) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      })

      if (error) {
        console.error("[Auth Callback Route] Token verification error:", error)
        return NextResponse.redirect(
          new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        )
      }

      if (data.user) {
        console.log("[Auth Callback Route] Session established via token for user:", data.user.id)

        // Fetch user role from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()

        // Handle password recovery
        if (type === "recovery") {
          return NextResponse.redirect(new URL("/auth/reset-password?verified=true&from_auth=true", requestUrl.origin))
        }

        // Redirect based on role with auth flag for loading screen
        if (profile?.role === "ADMIN" || profile?.role === "SUPERADMIN") {
          return NextResponse.redirect(new URL("/admin?from_auth=true", requestUrl.origin))
        } else {
          return NextResponse.redirect(new URL(`${next}?from_auth=true`, requestUrl.origin))
        }
      }
    } catch (error) {
      console.error("[Auth Callback Route] Token verification error:", error)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=Authentication failed`, requestUrl.origin)
      )
    }
  }

  // No code or token provided, redirect to signin
  console.log("[Auth Callback Route] No code or token, redirecting to signin")
  return NextResponse.redirect(new URL("/auth/signin", requestUrl.origin))
}
