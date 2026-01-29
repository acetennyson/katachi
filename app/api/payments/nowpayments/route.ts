import { NextRequest, NextResponse } from "next/server"
import { getNOWPaymentsService } from "@/lib/nowpayments-service"
import { getSupabaseServiceRole } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "USD", orderId, orderDescription } = await request.json()

    if (!amount || !orderId) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields (amount, orderId)"
      }, { status: 400 })
    }

    console.log("[NOWPayments] Creating payment:", { amount, currency, orderId })

    const nowPayments = getNOWPaymentsService()
    
    // Get the site URL for callbacks
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Create invoice (this shows a payment page with multiple crypto options)
    const invoice = await nowPayments.createInvoice({
      price_amount: amount,
      price_currency: currency,
      order_id: orderId,
      order_description: orderDescription || `Order ${orderId}`,
      ipn_callback_url: `${siteUrl}/api/payments/nowpayments/webhook`,
      success_url: `${siteUrl}/order-confirmation?order=${orderId}`,
      cancel_url: `${siteUrl}/checkout`,
    })

    console.log("[NOWPayments] Invoice created:", invoice.id)

    // Update order in database with payment info
    if (orderId) {
      const supabase = await getSupabaseServiceRole()
      const { error } = await supabase
        .from("orders")
        .update({
          payment_id: invoice.id,
          payment_status: "PENDING",
          payment_provider: "nowpayments",
        })
        .eq("order_number", orderId)

      if (error) {
        console.error("Failed to update order:", error)
      }
    }

    return NextResponse.json({
      success: true,
      invoiceId: invoice.id,
      invoiceUrl: invoice.invoice_url,
      paymentId: invoice.id,
    })
  } catch (error: any) {
    console.error("[NOWPayments] Error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create payment",
      details: error?.message
    }, { status: 500 })
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json({
        success: false,
        error: "Missing paymentId"
      }, { status: 400 })
    }

    const nowPayments = getNOWPaymentsService()
    const status = await nowPayments.getPaymentStatus(paymentId)

    return NextResponse.json({
      success: true,
      status: status.payment_status,
      details: status,
    })
  } catch (error: any) {
    console.error("[NOWPayments] Status check error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to check payment status",
      details: error?.message
    }, { status: 500 })
  }
}
