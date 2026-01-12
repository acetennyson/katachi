import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { calculateCurrentPosition } from "@/lib/live-tracking"
import { fetchRoute } from "@/lib/route-service"

/**
 * GET - Get live tracking for an order
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin()
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.message }, { status: authCheck.status })
  }

  try {
    const { id } = await params
    const supabase = await getSupabaseServiceRole()

    const { data: tracking, error } = await supabase
      .from("order_live_tracking")
      .select("*")
      .eq("order_id", id)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    if (!tracking) {
      return NextResponse.json({ success: true, tracking: null })
    }

    // Calculate current position
    const position = calculateCurrentPosition(tracking)

    return NextResponse.json({
      success: true,
      tracking: {
        ...tracking,
        calculated_position: position,
      },
    })
  } catch (error) {
    console.error("Error fetching tracking:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch tracking" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create/Start live tracking for an order
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin()
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.message }, { status: authCheck.status })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const supabase = await getSupabaseServiceRole()

    const {
      start_lat,
      start_lng,
      start_address,
      end_lat,
      end_lng,
      end_address,
      duration_minutes,
      route_type = 'STRAIGHT',
    } = body

    // Validate inputs
    if (!start_lat || !start_lng || !end_lat || !end_lng || !duration_minutes) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if tracking already exists
    const { data: existing } = await supabase
      .from("order_live_tracking")
      .select("id")
      .eq("order_id", id)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Live tracking already exists for this order" },
        { status: 400 }
      )
    }

    // Fetch route waypoints based on route type
    console.log(`Fetching ${route_type} route from ${start_lat},${start_lng} to ${end_lat},${end_lng}`)
    const waypoints = await fetchRoute(start_lat, start_lng, end_lat, end_lng, route_type)
    console.log(`Route generated with ${waypoints.length} waypoints`)

    // Create tracking session
    const { data: tracking, error } = await supabase
      .from("order_live_tracking")
      .insert({
        order_id: id,
        start_lat,
        start_lng,
        start_address,
        end_lat,
        end_lng,
        end_address,
        route_type,
        route_waypoints: waypoints,
        start_time: new Date().toISOString(),
        duration_minutes,
        status: "ACTIVE",
        current_lat: start_lat,
        current_lng: start_lng,
        created_by: authCheck.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating tracking:", error)
      throw error
    }

    // Update order status to SHIPPED if not already
    await supabase
      .from("orders")
      .update({ status: "SHIPPED", updated_at: new Date().toISOString() })
      .eq("id", id)

    return NextResponse.json({
      success: true,
      tracking,
    })
  } catch (error) {
    console.error("Error creating tracking:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create tracking" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update tracking (pause, resume, complete, cancel)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin()
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.message }, { status: authCheck.status })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const supabase = await getSupabaseServiceRole()

    const { action } = body // 'pause', 'resume', 'complete', 'cancel'

    // Get current tracking
    const { data: tracking, error: fetchError } = await supabase
      .from("order_live_tracking")
      .select("*")
      .eq("order_id", id)
      .single()

    if (fetchError || !tracking) {
      return NextResponse.json(
        { success: false, error: "Tracking not found" },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    const updateData: any = { last_updated: now }

    switch (action) {
      case "pause":
        if (tracking.status !== "ACTIVE") {
          return NextResponse.json(
            { success: false, error: "Can only pause active tracking" },
            { status: 400 }
          )
        }
        updateData.status = "PAUSED"
        updateData.paused_at = now
        break

      case "resume":
        if (tracking.status !== "PAUSED") {
          return NextResponse.json(
            { success: false, error: "Can only resume paused tracking" },
            { status: 400 }
          )
        }
        
        // Calculate how long it was paused
        const pausedDuration = tracking.paused_at
          ? Math.floor((new Date(now).getTime() - new Date(tracking.paused_at).getTime()) / 60000)
          : 0
        
        updateData.status = "ACTIVE"
        updateData.resumed_at = now
        updateData.total_paused_duration = (tracking.total_paused_duration || 0) + pausedDuration
        updateData.paused_at = null
        break

      case "complete":
        updateData.status = "COMPLETED"
        updateData.current_lat = tracking.end_lat
        updateData.current_lng = tracking.end_lng
        
        // Update order status to DELIVERED
        await supabase
          .from("orders")
          .update({ status: "DELIVERED", updated_at: now })
          .eq("id", id)
        break

      case "cancel":
        updateData.status = "CANCELLED"
        updateData.cancelled_at = now
        updateData.cancelled_by = authCheck.user.id
        break

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        )
    }

    // Update tracking
    const { data: updated, error: updateError } = await supabase
      .from("order_live_tracking")
      .update(updateData)
      .eq("order_id", id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      tracking: updated,
    })
  } catch (error) {
    console.error("Error updating tracking:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update tracking" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete tracking session
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin()
  if (!authCheck.ok) {
    return NextResponse.json({ error: authCheck.message }, { status: authCheck.status })
  }

  try {
    const { id } = await params
    const supabase = await getSupabaseServiceRole()

    const { error } = await supabase
      .from("order_live_tracking")
      .delete()
      .eq("order_id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tracking:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete tracking" },
      { status: 500 }
    )
  }
}
