import { getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Update user role (SUPERADMIN only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { role } = await request.json()

    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ["CUSTOMER", "ADMIN", "SUPPORT", "SUPERADMIN"]
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServiceRole()

    // Update user role
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", params.id)

    if (error) {
      console.error("Failed to update user role:", error)
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      )
    }

    // Log the role change
    await supabase.from("admin_activity_logs").insert({
      action: "update_user_role",
      details: { user_id: params.id, new_role: role },
    })

    return NextResponse.json({ 
      message: "User role updated successfully",
      role 
    })
  } catch (error) {
    console.error("Failed to update user role:", error)
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    )
  }
}
