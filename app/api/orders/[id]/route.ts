import { getSupabaseServiceRole, getSupabaseServer } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try to get user from header (old way) or from session (new way)
    const userIdFromHeader = request.headers.get("x-user-id")
    
    // Get current authenticated user
    const supabase = await getSupabaseServer()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || userIdFromHeader

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params in Next.js 16
    const { id } = await params

    const supabaseService = await getSupabaseServiceRole()

    // Get user profile to check role
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    // Fetch order with all details and items
    const { data: order, error } = await supabaseService
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        payment_status,
        subtotal,
        tax,
        total,
        shipping_address,
        tracking_number,
        carrier,
        estimated_delivery,
        created_at,
        updated_at,
        user_id,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        )
      }
      console.error("[Order Detail API] Error fetching order:", error)
      throw error
    }

    // Check access: user owns order OR is SUPERADMIN/ADMIN
    const isAdmin = profile?.role === "SUPERADMIN" || profile?.role === "ADMIN"
    const isOwner = order.user_id === userId

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to view this order" },
        { status: 403 }
      )
    }

    // Calculate total_price for each order item and parse shipping_address
    const shippingAddress = typeof order.shipping_address === 'string' 
      ? JSON.parse(order.shipping_address) 
      : order.shipping_address || {}

    const orderWithCalculatedTotals = {
      ...order,
      // Extract shipping fields from JSON
      shipping_name: shippingAddress.name || '',
      shipping_email: shippingAddress.email || '',
      shipping_phone: shippingAddress.phone || '',
      shipping_address_line1: shippingAddress.addressLine1 || '',
      shipping_address_line2: shippingAddress.addressLine2 || '',
      shipping_city: shippingAddress.city || '',
      shipping_state: shippingAddress.state || '',
      shipping_postal_code: shippingAddress.postalCode || '',
      shipping_country: shippingAddress.country || 'BE',
      order_items: order.order_items?.map(item => ({
        ...item,
        total_price: item.quantity * item.unit_price
      }))
    }

    return NextResponse.json({ 
      success: true, 
      order: orderWithCalculatedTotals 
    })
  } catch (error: any) {
    console.error("[Order Detail API] Failed to fetch order:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch order details",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}
