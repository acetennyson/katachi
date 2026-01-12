import { getSupabaseServer } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Send magic link (passwordless login) to user's email
 */
export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      console.error("Magic link error:", error)
      return NextResponse.json(
        {
          error: "Failed to send magic link",
          details: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: "Magic link sent! Check your email.",
    })
  } catch (error) {
    console.error("Magic link error:", error)
    return NextResponse.json(
      {
        error: "Failed to send magic link",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
