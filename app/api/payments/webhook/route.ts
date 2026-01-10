import { getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Handle payment webhooks from Stripe, PayPal, Flutterwave
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!stripe) {
      console.error("Stripe not configured")
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
    }

    let event: Stripe.Event

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
        console.log("[v0] Webhook signature verified")
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message)
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
      }
    } else {
      // Parse without verification (development only)
      event = JSON.parse(body)
      console.warn("Webhook signature verification skipped (no STRIPE_WEBHOOK_SECRET configured)")
    }

    console.log("[v0] Stripe webhook event:", event.type)

    const supabase = await getSupabaseServiceRole()

    // Handle different payment events
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSuccess(paymentIntent.id, supabase)
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(paymentIntent.id, supabase)
        break
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentCanceled(paymentIntent.id, supabase)
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        await handleRefund(charge.payment_intent as string, supabase)
        break
      }

      default:
        console.log("[v0] Unhandled event type:", event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("[v0] Webhook error:", error)
    return NextResponse.json({ 
      error: "Webhook processing failed",
      details: error?.message
    }, { status: 500 })
  }
}

async function handlePaymentSuccess(paymentId: string, supabase: any) {
  console.log(`[v0] Payment succeeded: ${paymentId}`)

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "COMPLETED",
      status: "PROCESSING",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_id", paymentId)

  if (error) {
    console.error("Failed to update order:", error)
  } else {
    console.log(`[v0] Order updated for payment ${paymentId}`)
  }
}

async function handlePaymentFailed(paymentId: string, supabase: any) {
  console.log(`[v0] Payment failed: ${paymentId}`)

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "FAILED",
      status: "CANCELLED",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_id", paymentId)

  if (error) {
    console.error("Failed to update order:", error)
  }
}

async function handlePaymentCanceled(paymentId: string, supabase: any) {
  console.log(`[v0] Payment canceled: ${paymentId}`)

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "CANCELLED",
      status: "CANCELLED",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_id", paymentId)

  if (error) {
    console.error("Failed to update order:", error)
  }
}

async function handleRefund(paymentId: string, supabase: any) {
  console.log(`[v0] Payment refunded: ${paymentId}`)

  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: "REFUNDED",
      status: "REFUNDED",
      updated_at: new Date().toISOString(),
    })
    .eq("payment_id", paymentId)

  if (error) {
    console.error("Failed to update order:", error)
  }
}
