import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase"

/**
 * Public order tracking endpoint
 * Requires order number and email for verification
 * Does NOT require authentication - anyone with order details can track
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderNumber = searchParams.get("orderNumber")
    const email = searchParams.get("email")

    if (!orderNumber || !email) {
      return NextResponse.json(
        { success: false, error: "Order number and email are required" },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServiceRole()

    // Fetch order with email verification
    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        payment_status,
        created_at,
        updated_at,
        total,
        shipping_name,
        shipping_email,
        shipping_address_line1,
        shipping_address_line2,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        tracking_number,
        carrier,
        estimated_delivery,
        order_items (
          id,
          product_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq("order_number", orderNumber)
      .eq("shipping_email", email)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Order not found. Please check your order number and email address." 
        },
        { status: 404 }
      )
    }

    // Return order with ID (needed for live tracking) but remove sensitive email
    const { shipping_email, ...safeOrder } = order

    return NextResponse.json({
      success: true,
      order: {
        ...safeOrder,
        id: order.id, // Include ID for live tracking lookup
      },
    })
  } catch (error) {
    console.error("Error fetching order tracking:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch tracking information" },
      { status: 500 }
    )
  }
}
