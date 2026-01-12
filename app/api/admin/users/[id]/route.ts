import { getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Get a specific user (SUPERADMIN only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServiceRole()

    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Failed to fetch user:", error)
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Failed to fetch user:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    )
  }
}
