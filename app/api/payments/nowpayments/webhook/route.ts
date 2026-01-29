import { NextRequest, NextResponse } from "next/server"
import { getNOWPaymentsService } from "@/lib/nowpayments-service"
import { getSupabaseServiceRole } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-nowpayments-sig')

    console.log("[NOWPayments Webhook] Received IPN")
    console.log("[NOWPayments Webhook] Headers:", {
      signature: signature ? 'present' : 'missing',
      contentType: request.headers.get('content-type'),
    })

    // Verify signature if IPN secret is configured
    if (signature && process.env.NOWPAYMENTS_IPN_SECRET) {
      const nowPayments = getNOWPaymentsService()
      const isValid = nowPayments.verifyIPN(signature, body)
      
      if (!isValid) {
        console.error("[NOWPayments Webhook] Invalid signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
      console.log("[NOWPayments Webhook] ✅ Signature verified")
    } else if (!process.env.NOWPAYMENTS_IPN_SECRET) {
      console.warn("[NOWPayments Webhook] ⚠️ IPN secret not configured - signature verification skipped")
    }

    const data = JSON.parse(body)
    console.log("[NOWPayments Webhook] Payment data:", {
      orderId: data.order_id,
      paymentStatus: data.payment_status,
      paymentId: data.payment_id,
      amount: data.price_amount,
      currency: data.price_currency,
    })

    // Update order in database based on payment status
    const supabase = await getSupabaseServiceRole()
    
    let paymentStatus = "PENDING"
    let orderStatus = "PENDING"

    switch (data.payment_status) {
      case "finished":
      case "confirmed":
        paymentStatus = "PAID"
        orderStatus = "CONFIRMED"
        break
      case "partially_paid":
        paymentStatus = "PARTIAL"
        orderStatus = "PENDING"
        break
      case "failed":
      case "expired":
      case "refunded":
        paymentStatus = "FAILED"
        orderStatus = "CANCELLED"
        break
      default:
        paymentStatus = "PENDING"
    }

    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("order_number", data.order_id)

    if (error) {
      console.error("[NOWPayments Webhook] Failed to update order:", error)
      return NextResponse.json({ error: "Database update failed" }, { status: 500 })
    }

    console.log("[NOWPayments Webhook] ✅ Order updated successfully:", {
      orderId: data.order_id,
      newPaymentStatus: paymentStatus,
      newOrderStatus: orderStatus,
    })

    return NextResponse.json({ 
      success: true,
      order_id: data.order_id,
      payment_status: paymentStatus,
    })
  } catch (error: any) {
    console.error("[NOWPayments Webhook] Error:", error)
    return NextResponse.json({ 
      error: "Webhook processing failed",
      details: error?.message 
    }, { status: 500 })
  }
}
