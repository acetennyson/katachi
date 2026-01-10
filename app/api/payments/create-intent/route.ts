import { getSupabaseServiceRole } from "@/lib/supabase"
import { createPaymentIntent } from "@/lib/payment-service"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, currency = "EUR", provider = "stripe", orderId } = await request.json()

    if (!amount) {
      return NextResponse.json({ 
        success: false,
        error: "Missing required fields (amount)" 
      }, { status: 400 })
    }

    console.log("[v0] Creating payment intent:", { userId, amount, currency, provider, orderId })

    // Create payment intent with provider
    const paymentIntent = await createPaymentIntent(userId || "guest", amount, currency, provider)

    // Update order in database if orderId provided (using service role)
    if (orderId) {
      const supabase = await getSupabaseServiceRole()
      const { error } = await supabase
        .from("orders")
        .update({
          payment_id: paymentIntent.id,
          payment_status: "AUTHORIZED",
        })
        .eq("order_number", orderId)

      if (error) {
        console.error("Failed to update order:", error)
        // Don't fail the request, payment intent is still valid
      }
    }

    return NextResponse.json({
      success: true,
      ...paymentIntent
    })
  } catch (error: any) {
    console.error("Payment intent error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Failed to create payment intent",
      details: error?.message
    }, { status: 500 })
  }
}
