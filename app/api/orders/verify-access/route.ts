import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole, getSupabaseServer } from "@/lib/supabase"

/**
 * Verify if the current user can access an order
 * Allows: Order owner OR SUPERADMIN
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderNumber = searchParams.get("orderNumber")

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, error: "Order number is required" },
        { status: 400 }
      )
    }

    // Get current user
    const supabase = await getSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      )
    }

    const supabaseService = await getSupabaseServiceRole()

    // Get user profile to check role
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    // SUPERADMIN can access any order
    if (profile?.role === "SUPERADMIN" || profile?.role === "ADMIN") {
      const { data: order } = await supabaseService
        .from("orders")
        .select("id")
        .eq("order_number", orderNumber)
        .single()

      if (order) {
        return NextResponse.json({
          success: true,
          canAccess: true,
          orderId: order.id,
          reason: "admin",
        })
      }
    }

    // Check if order belongs to this user
    const { data: order, error } = await supabaseService
      .from("orders")
      .select("id, user_id")
      .eq("order_number", orderNumber)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }

    // Check if user owns this order
    if (order.user_id === user.id) {
      return NextResponse.json({
        success: true,
        canAccess: true,
        orderId: order.id,
        reason: "owner",
      })
    }

    // User doesn't own this order and is not admin
    return NextResponse.json(
      { 
        success: false, 
        canAccess: false,
        error: "You don't have permission to view this order" 
      },
      { status: 403 }
    )
  } catch (error) {
    console.error("Error verifying order access:", error)
    return NextResponse.json(
      { success: false, error: "Failed to verify access" },
      { status: 500 }
    )
  }
}
