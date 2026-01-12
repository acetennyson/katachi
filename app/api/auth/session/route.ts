import { getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Get user session data including profile
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Fetch user profile with role using service role (bypasses RLS)
    const supabaseAdmin = await getSupabaseServiceRole()
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, name, role")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.json(
        {
          error: "Failed to fetch profile",
          details: profileError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
      },
    })
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
