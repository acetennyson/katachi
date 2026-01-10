import { getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"
import settings from "@/lib/constants/settings"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderNumber, userId, items, subtotal, tax, shipping, total, shippingAddress, paymentMethod, shippingMethodId, shippingMethodName } = body

    // Use service role to bypass RLS
    const supabase = await getSupabaseServiceRole()

    // Determine order status based on payment method
    // Manual card payments should be PENDING, others are PAID
    const isManualCardPayment = paymentMethod === "credit-card" && !settings.payment.card
    const orderStatus = isManualCardPayment ? "PENDING" : "PAID"
    const paymentStatus = isManualCardPayment ? "PENDING" : "PAID"

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id: userId,
          order_number: orderNumber,
          status: orderStatus,
          payment_status: paymentStatus,
          subtotal,
          tax,
          shipping_cost: shipping || 0,
          total,
          shipping_address: shippingAddress,
          shipping_method_id: shippingMethodId || "standard",
          shipping_method_name: shippingMethodName || "Standard Shipping",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (orderError) throw orderError

    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId || null, // Store product_id for navigation
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        tax_percentage: item.taxPercentage ?? settings.defaults.taxPercentage,
        shipping_price: item.shippingPrice ?? settings.defaults.shippingPrice,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError
    }

    console.log("[v0] Order created in Supabase:", order.id)

    return NextResponse.json({ success: true, orderId: order.id, orderNumber })
  } catch (error: any) {
    console.error("[v0] Order creation error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create order",
      details: error?.message || "Unknown error",
      code: error?.code,
      hint: error?.hint
    }, { status: 500 })
  }
}
