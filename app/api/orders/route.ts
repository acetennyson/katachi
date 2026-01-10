import { getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await getSupabaseServiceRole()

    // Fetch orders with aggregated item count
    const { data: orders, error } = await supabase
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
        created_at,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Orders API] Error fetching orders:", error)
      throw error
    }

    // Transform data to include item count and calculate total_price
    const transformedOrders = orders?.map(order => ({
      ...order,
      items_count: order.order_items?.length || 0,
      order_items: order.order_items?.map(item => ({
        ...item,
        total_price: item.quantity * item.unit_price
      }))
    })) || []

    return NextResponse.json({ 
      success: true, 
      orders: transformedOrders 
    })
  } catch (error: any) {
    console.error("[Orders API] Failed to fetch orders:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch orders",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}
