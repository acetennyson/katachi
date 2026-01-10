import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase"
import Stripe from "stripe"

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null

// Save ALL card payment information to Supabase after successful payment
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      orderId, 
      paymentIntentId, 
      amount, 
      currency 
    } = await request.json()

    if (!paymentIntentId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!stripe) {
      console.warn("Stripe not configured, cannot save card")
      return NextResponse.json({ success: false, message: "Stripe not configured" })
    }

    console.log("[v0] Saving card payment to Supabase:", paymentIntentId)

    // Get COMPLETE payment intent details from Stripe with expanded payment_method
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method', 'customer']
    })
    
    console.log("[v0] Payment intent retrieved, status:", paymentIntent.status)
    console.log("[v0] Payment method type:", typeof paymentIntent.payment_method)
    
    // Get payment method - should be expanded object now
    let paymentMethod: Stripe.PaymentMethod
    
    if (typeof paymentIntent.payment_method === 'string') {
      console.log("[v0] Payment method is string, retrieving:", paymentIntent.payment_method)
      // If it's still a string, retrieve it separately
      paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
    } else if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'object') {
      console.log("[v0] Payment method already expanded")
      // If it's already expanded, use it directly
      paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod
    } else {
      console.error("[v0] Payment method is null or undefined:", paymentIntent.payment_method)
      throw new Error("Payment method not found on payment intent")
    }
    
    const paymentMethodId = paymentMethod.id
    console.log("[v0] Payment method ID:", paymentMethodId)

    if (!paymentMethod.card) {
      console.error("[v0] No card data on payment method")
      throw new Error("Card details not available")
    }
    
    console.log("[v0] Card details found:", paymentMethod.card.brand, "****" + paymentMethod.card.last4)

    // Get user's IP and user agent
    const ip = request.headers.get("x-forwarded-for") || 
               request.headers.get("x-real-ip") || 
               null
    const userAgent = request.headers.get("user-agent") || null

    // Save ALL card information to Supabase
    const supabase = await getSupabaseServiceRole()
    const { data, error } = await supabase
      .from("card_payments")
      .insert({
        user_id: userId || null,
        order_id: orderId || null,
        payment_intent_id: paymentIntentId,
        payment_method_id: paymentMethodId,
        
        // Complete card information
        card_fingerprint: paymentMethod.card.fingerprint,
        card_brand: paymentMethod.card.brand,
        card_last4: paymentMethod.card.last4,
        card_exp_month: paymentMethod.card.exp_month,
        card_exp_year: paymentMethod.card.exp_year,
        card_country: paymentMethod.card.country,
        card_funding: paymentMethod.card.funding, // credit, debit, prepaid
        
        // Additional card details
        card_network: paymentMethod.card.network || paymentMethod.card.brand,
        card_wallet: paymentMethod.card.wallet?.type || null, // apple_pay, google_pay, etc
        card_three_d_secure_usage: paymentMethod.card.three_d_secure_usage?.supported ? 'supported' : null,
        
        // Complete billing details
        billing_name: paymentMethod.billing_details?.name || null,
        billing_email: paymentMethod.billing_details?.email || null,
        billing_phone: paymentMethod.billing_details?.phone || null,
        billing_address_line1: paymentMethod.billing_details?.address?.line1 || null,
        billing_address_line2: paymentMethod.billing_details?.address?.line2 || null,
        billing_address_city: paymentMethod.billing_details?.address?.city || null,
        billing_address_state: paymentMethod.billing_details?.address?.state || null,
        billing_address_postal_code: paymentMethod.billing_details?.address?.postal_code || null,
        billing_address_country: paymentMethod.billing_details?.address?.country || null,
        
        // Payment details
        amount: amount,
        currency: currency || "EUR",
        payment_status: "COMPLETED",
        
        // Transaction metadata
        ip_address: ip,
        user_agent: userAgent,
        
        // Stripe metadata
        stripe_customer_id: typeof paymentIntent.customer === 'string' ? paymentIntent.customer : null,
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to save card payment to Supabase:", error)
      throw error
    }

    console.log("[v0] Card payment saved to Supabase successfully:", data.id)

    return NextResponse.json({
      success: true,
      cardPaymentId: data.id,
      message: "Card payment saved successfully",
    })
  } catch (error: any) {
    console.error("Card tracking error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to save card payment",
      details: error?.message,
    }, { status: 500 })
  }
}
