import { NextRequest, NextResponse } from "next/server"
import { getRazorpayService } from "@/lib/razorpay-service"
import { getSupabaseServiceRole } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    console.log("[Razorpay Webhook] Received webhook")

    // Verify webhook signature
    if (signature && process.env.RAZORPAY_WEBHOOK_SECRET) {
      const razorpay = getRazorpayService()
      const isValid = razorpay.verifyWebhookSignature(
        body,
        signature,
        process.env.RAZORPAY_WEBHOOK_SECRET
      )
      
      if (!isValid) {
        console.error("[Razorpay Webhook] Invalid signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
      console.log("[Razorpay Webhook] ✅ Signature verified")
    } else {
      console.warn("[Razorpay Webhook] ⚠️ Webhook secret not configured - signature verification skipped")
    }

    const data = JSON.parse(body)
    const event = data.event
    const payload = data.payload.payment?.entity || data.payload.order?.entity

    console.log("[Razorpay Webhook] Event:", event)
    console.log("[Razorpay Webhook] Payload:", {
      id: payload?.id,
      status: payload?.status,
      amount: payload?.amount,
    })

    // Update order based on event
    const supabase = await getSupabaseServiceRole()
    
    let paymentStatus = "PENDING"
    let orderStatus = "PENDING"

    switch (event) {
      case "payment.captured":
        paymentStatus = "PAID"
        orderStatus = "CONFIRMED"
        break
      case "payment.failed":
        paymentStatus = "FAILED"
        orderStatus = "CANCELLED"
        break
      case "order.paid":
        paymentStatus = "PAID"
        orderStatus = "CONFIRMED"
        break
      default:
        paymentStatus = "PENDING"
    }

    // Find order by payment_id (Razorpay order ID)
    const { data: orders, error: fetchError } = await supabase
      .from("orders")
      .select("order_number")
      .eq("payment_id", payload?.order_id || payload?.id)
      .limit(1)

    if (fetchError || !orders || orders.length === 0) {
      console.error("[Razorpay Webhook] Order not found:", payload?.order_id)
      return NextResponse.json({ 
        success: false,
        error: "Order not found" 
      }, { status: 404 })
    }

    const orderNumber = orders[0].order_number

    // Update order status
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("order_number", orderNumber)

    if (error) {
      console.error("[Razorpay Webhook] Failed to update order:", error)
      return NextResponse.json({ error: "Database update failed" }, { status: 500 })
    }

    console.log("[Razorpay Webhook] ✅ Order updated successfully:", {
      orderNumber,
      event,
      newPaymentStatus: paymentStatus,
      newOrderStatus: orderStatus,
    })

    return NextResponse.json({ 
      success: true,
      order_number: orderNumber,
      payment_status: paymentStatus,
    })
  } catch (error: any) {
    console.error("[Razorpay Webhook] Error:", error)
    return NextResponse.json({ 
      error: "Webhook processing failed",
      details: error?.message 
    }, { status: 500 })
  }
}
