import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase"
import Stripe from "stripe"

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null

// GET - Retrieve saved payment methods for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    if (!stripe) {
      return NextResponse.json({ cards: [] })
    }

    // Get user's Stripe customer ID from database
    const supabase = await getSupabaseServiceRole()
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      // User doesn't have saved cards yet
      return NextResponse.json({ cards: [] })
    }

    // Fetch customer to get default payment method
    const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
    const defaultPaymentMethodId = 
      typeof customer !== "deleted" && customer.invoice_settings?.default_payment_method
        ? customer.invoice_settings.default_payment_method
        : null

    // List payment methods for this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: "card",
    })

    const cards = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand || "card",
      last4: pm.card?.last4 || "0000",
      exp_month: pm.card?.exp_month || 12,
      exp_year: pm.card?.exp_year || 2030,
      isDefault: pm.id === defaultPaymentMethodId,
    }))

    return NextResponse.json({ cards })
  } catch (error: any) {
    console.error("Failed to fetch saved cards:", error)
    return NextResponse.json({
      error: "Failed to fetch saved cards",
      details: error?.message,
    }, { status: 500 })
  }
}
