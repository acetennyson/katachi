import { getSupabaseServer } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Send password reset email
 */
export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (error) {
      console.error("Password reset error:", error)
      return NextResponse.json(
        {
          error: "Failed to send password reset email",
          details: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: "Password reset email sent! Check your inbox.",
    })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      {
        error: "Failed to send password reset email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
