import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServiceRole()

    // Fetch all orders with items
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
        created_at,
        user_id,
        order_items (
          id,
          product_name,
          quantity,
          unit_price
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Admin Orders API] Error:", error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      orders: orders || [] 
    })
  } catch (error: any) {
    console.error("[Admin Orders API] Failed:", error)
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
