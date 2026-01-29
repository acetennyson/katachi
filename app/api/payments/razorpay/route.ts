import { NextRequest, NextResponse } from "next/server"
import { getRazorpayService } from "@/lib/razorpay-service"
import { getSupabaseServiceRole } from "@/lib/supabase"

// Create Razorpay order
export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "INR", orderId, orderDescription } = await request.json()

    if (!amount || !orderId) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields (amount, orderId)"
      }, { status: 400 })
    }

    console.log("[Razorpay] Creating order:", { amount, currency, orderId })

    const razorpay = getRazorpayService()
    
    // Convert amount to smallest currency unit
    // INR: 1 = 100 paise, USD: 1 = 100 cents
    const amountInSmallestUnit = Math.round(amount * 100)

    // Create Razorpay order
    const order = await razorpay.createOrder({
      amount: amountInSmallestUnit,
      currency: currency.toUpperCase(),
      receipt: orderId,
      notes: {
        order_id: orderId,
        description: orderDescription || `Order ${orderId}`,
      },
    })

    console.log("[Razorpay] Order created:", order.id)

    // Update order in database with Razorpay order ID
    const supabase = await getSupabaseServiceRole()
    const { error } = await supabase
      .from("orders")
      .update({
        payment_id: order.id,
        payment_status: "PENDING",
        payment_provider: "razorpay",
      })
      .eq("order_number", orderId)

    if (error) {
      console.error("[Razorpay] Failed to update order:", error)
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (error: any) {
    console.error("[Razorpay] Error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create order",
      details: error?.message
    }, { status: 500 })
  }
}

// Verify payment
export async function PUT(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_number } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields"
      }, { status: 400 })
    }

    console.log("[Razorpay] Verifying payment:", razorpay_payment_id)

    const razorpay = getRazorpayService()

    // Verify signature
    const isValid = razorpay.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })

    if (!isValid) {
      console.error("[Razorpay] Invalid signature")
      return NextResponse.json({
        success: false,
        error: "Invalid payment signature"
      }, { status: 400 })
    }

    // Fetch payment details
    const payment = await razorpay.fetchPayment(razorpay_payment_id)

    // Update order status in database
    const supabase = await getSupabaseServiceRole()
    const { error } = await supabase
      .from("orders")
      .update({
        payment_id: razorpay_payment_id,
        payment_status: payment.status === "captured" ? "PAID" : "PENDING",
        status: payment.status === "captured" ? "CONFIRMED" : "PENDING",
        updated_at: new Date().toISOString(),
      })
      .eq("order_number", order_number)

    if (error) {
      console.error("[Razorpay] Failed to update order:", error)
      return NextResponse.json({
        success: false,
        error: "Failed to update order"
      }, { status: 500 })
    }

    console.log("[Razorpay] ✅ Payment verified and order updated:", order_number)

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      status: payment.status,
    })
  } catch (error: any) {
    console.error("[Razorpay] Verification error:", error)
    return NextResponse.json({
      success: false,
      error: "Payment verification failed",
      details: error?.message
    }, { status: 500 })
  }
}
