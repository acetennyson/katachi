import { getSupabaseServer } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Update user password (must be authenticated)
 */
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    // Update password
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      console.error("Password update error:", error)
      return NextResponse.json(
        {
          error: "Failed to update password",
          details: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: "Password updated successfully!",
    })
  } catch (error) {
    console.error("Password update error:", error)
    return NextResponse.json(
      {
        error: "Failed to update password",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
