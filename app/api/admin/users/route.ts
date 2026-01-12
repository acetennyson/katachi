import { getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Get all users (SUPERADMIN only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServiceRole()

    // Fetch all users with their profiles
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, email, name, role, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch users:", error)
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      )
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}
