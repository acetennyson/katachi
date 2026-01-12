import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole, getSupabaseServer } from "@/lib/supabase"
import { calculateCurrentPosition } from "@/lib/live-tracking"

/**
 * Public API to get live tracking for an order
 * Requires authentication - user must own order or be admin
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    
    // Get authenticated user
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

    // Fetch order
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .select("id, order_number, status, user_id")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      )
    }

    // Check access: user owns order OR is SUPERADMIN/ADMIN
    const isAdmin = profile?.role === "SUPERADMIN" || profile?.role === "ADMIN"
    const isOwner = order.user_id === user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to view this order" },
        { status: 403 }
      )
    }

    // Get live tracking
    const { data: tracking, error: trackingError } = await supabase
      .from("order_live_tracking")
      .select("*")
      .eq("order_id", orderId)
      .single()

    if (trackingError && trackingError.code !== "PGRST116") {
      throw trackingError
    }

    if (!tracking) {
      return NextResponse.json({
        success: true,
        hasTracking: false,
        order: {
          order_number: order.order_number,
          status: order.status,
        },
      })
    }

    // Calculate current position
    const position = calculateCurrentPosition(tracking)

    // Update current position in database (for caching)
    if (tracking.status === "ACTIVE") {
      await supabase
        .from("order_live_tracking")
        .update({
          current_lat: position.lat,
          current_lng: position.lng,
          last_updated: new Date().toISOString(),
        })
        .eq("order_id", orderId)
    }

    // Return safe tracking data (no internal IDs)
    return NextResponse.json({
      success: true,
      hasTracking: true,
      order: {
        order_number: order.order_number,
        status: order.status,
      },
      tracking: {
        start_lat: tracking.start_lat,
        start_lng: tracking.start_lng,
        start_address: tracking.start_address,
        end_lat: tracking.end_lat,
        end_lng: tracking.end_lng,
        end_address: tracking.end_address,
        status: tracking.status,
        current_lat: position.lat,
        current_lng: position.lng,
        progress: position.progress,
        eta: position.eta,
        isComplete: position.isComplete,
      },
    })
  } catch (error) {
    console.error("Error fetching live tracking:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch tracking" },
      { status: 500 }
    )
  }
}
