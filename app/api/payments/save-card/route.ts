import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase"
import Stripe from "stripe"

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null

// Save payment method for future use
export async function POST(request: NextRequest) {
  try {
    const { userId, paymentMethodId } = await request.json()

    if (!userId || !paymentMethodId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!stripe) {
      console.warn("Stripe not configured, cannot save payment method")
      return NextResponse.json({ 
        success: false,
        message: "Stripe not configured" 
      })
    }

    console.log("[v0] Saving payment method for user:", userId)

    // Get or create Stripe customer for this user
    const supabase = await getSupabaseServiceRole()
    
    // Check if user already has a Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, name")
      .eq("id", userId)
      .single()

    if (profileError) {
      throw new Error("Failed to fetch user profile")
    }

    let customerId = profile.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.name || undefined,
        metadata: {
          userId: userId,
        },
      })
      
      customerId = customer.id

      // Save customer ID to database
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId)

      console.log("[v0] Created Stripe customer:", customerId)
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    console.log("[v0] Payment method attached to customer:", customerId)

    // Set as default payment method if it's the first one
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    })

    if (paymentMethods.data.length === 1) {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
      console.log("[v0] Set as default payment method")
    }

    return NextResponse.json({
      success: true,
      message: "Payment method saved successfully",
      customerId: customerId,
    })
  } catch (error: any) {
    console.error("Failed to save payment method:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to save payment method",
      details: error?.message,
    }, { status: 500 })
  }
}
