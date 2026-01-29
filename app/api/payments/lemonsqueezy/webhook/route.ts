import { NextRequest, NextResponse } from "next/server"
import { getLemonsqueezyService } from "@/lib/lemonsqueezy-service"
import { getSupabaseServiceRole } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')

    console.log("[Lemonsqueezy Webhook] Received webhook")
    console.log("[Lemonsqueezy Webhook] Headers:", {
      signature: signature ? 'present' : 'missing',
      contentType: request.headers.get('content-type'),
    })

    // Verify signature if webhook secret is configured
    if (signature && process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
      const lemonsqueezy = getLemonsqueezyService()
      const isValid = lemonsqueezy.verifyWebhookSignature(
        body,
        signature,
        process.env.LEMONSQUEEZY_WEBHOOK_SECRET
      )
      
      if (!isValid) {
        console.error("[Lemonsqueezy Webhook] Invalid signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
      console.log("[Lemonsqueezy Webhook] ✅ Signature verified")
    } else if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
      console.warn("[Lemonsqueezy Webhook] ⚠️ Webhook secret not configured - signature verification skipped")
    }

    const data = JSON.parse(body)
    const eventName = data.meta?.event_name
    const attributes = data.data?.attributes
    const customData = attributes?.custom_data || {}

    console.log("[Lemonsqueezy Webhook] Event:", eventName)
    console.log("[Lemonsqueezy Webhook] Data:", {
      orderId: customData.order_id,
      status: attributes?.status,
      total: attributes?.total,
      currency: attributes?.currency,
    })

    // Update order based on event
    const supabase = await getSupabaseServiceRole()
    
    let paymentStatus = "PENDING"
    let orderStatus = "PENDING"

    switch (eventName) {
      case "order_created":
        paymentStatus = "PENDING"
        orderStatus = "PENDING"
        break
      
      case "order_refunded":
        paymentStatus = "REFUNDED"
        orderStatus = "REFUNDED"
        break
        
      case "subscription_payment_success":
      case "subscription_created":
        paymentStatus = "PAID"
        orderStatus = "CONFIRMED"
        break
        
      case "subscription_payment_failed":
        paymentStatus = "FAILED"
        orderStatus = "CANCELLED"
        break
        
      case "subscription_cancelled":
      case "subscription_expired":
        paymentStatus = "CANCELLED"
        orderStatus = "CANCELLED"
        break

      // For one-time purchases
      default:
        if (attributes?.status === "paid") {
          paymentStatus = "PAID"
          orderStatus = "CONFIRMED"
        } else if (attributes?.status === "refunded") {
          paymentStatus = "REFUNDED"
          orderStatus = "REFUNDED"
        }
    }

    // Find order by custom order_id
    const orderNumber = customData.order_id

    if (!orderNumber) {
      console.error("[Lemonsqueezy Webhook] No order_id in custom data")
      return NextResponse.json({ 
        success: false,
        error: "No order_id found" 
      }, { status: 400 })
    }

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
      console.error("[Lemonsqueezy Webhook] Failed to update order:", error)
      return NextResponse.json({ error: "Database update failed" }, { status: 500 })
    }

    console.log("[Lemonsqueezy Webhook] ✅ Order updated successfully:", {
      orderNumber,
      event: eventName,
      newPaymentStatus: paymentStatus,
      newOrderStatus: orderStatus,
    })

    return NextResponse.json({ 
      success: true,
      order_number: orderNumber,
      payment_status: paymentStatus,
    })
  } catch (error: any) {
    console.error("[Lemonsqueezy Webhook] Error:", error)
    return NextResponse.json({ 
      error: "Webhook processing failed",
      details: error?.message 
    }, { status: 500 })
  }
}
