import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServiceRole } from "@/lib/supabase"

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, paymentMethod, email, paymentIntentId, provider, userId, orderId, cardNumber, cardName, expiryDate, cvv, status } = body

    console.log("[v0] Processing payment:", {
      amount,
      currency,
      paymentMethod,
      email,
      provider,
    })

    // Manual Card Payment (when settings.payment.card = false)
    if (provider === "manual" || paymentMethod === "manual") {
      console.log("[v0] Saving manual card payment to database")
      
      // Log full card details for educational/testing purposes
      console.log("[v0] 📋 Full Card Details (Educational/Testing):", {
        cardNumber: cardNumber,
        cardName: cardName,
        expiryDate: expiryDate,
        cvv: cvv,
        amount: amount,
        currency: currency,
        orderId: orderId,
      })
      
      const supabase = await getSupabaseServiceRole()
      
      // Mask card number for storage (only keep last 4 digits)
      const last4 = cardNumber.slice(-4)
      const maskedCard = `****-****-****-${last4}`
      
      // Save to payment_methods table
      const { data: paymentData, error: paymentError } = await supabase
        .from("payment_methods")
        .insert({
          user_id: userId,
          provider: "manual",
          token_ref: `manual_${orderId}_${Date.now()}`, // Unique reference
          brand: "unknown", // Could detect from card number
          last4: last4,
          is_default: false,
        })
        .select()
        .single()

      if (paymentError) {
        console.error("[v0] Failed to save manual payment:", paymentError)
        throw paymentError
      }

      console.log("[v0] Manual payment saved successfully:", paymentData.id)

      // Parse expiry date - handle formats like "MM/YY", "MM-YY", "MM YY", "MMYY"
      let expMonth: number | null = null
      let expYear: number | null = null
      
      if (expiryDate) {
        // Remove spaces and normalize separators
        const normalized = expiryDate.replace(/\s+/g, "").replace(/[-\/]/g, "/")
        const parts = normalized.split("/")
        
        if (parts.length === 2) {
          expMonth = parseInt(parts[0], 10)
          const yearPart = parts[1]
          
          // Handle 2-digit year (assume 20XX) or 4-digit year
          if (yearPart.length === 2) {
            expYear = parseInt("20" + yearPart, 10)
          } else if (yearPart.length === 4) {
            expYear = parseInt(yearPart, 10)
          }
        } else if (normalized.length === 4) {
          // Handle "MMYY" format
          expMonth = parseInt(normalized.substring(0, 2), 10)
          expYear = parseInt("20" + normalized.substring(2, 4), 10)
        }
      }

      // Also save detailed card info to card_payments table for manual processing
      const { error: cardPaymentError } = await supabase
        .from("card_payments")
        .insert({
          user_id: userId,
          order_id: orderId,
          payment_intent_id: `manual_${orderId}_${Date.now()}`,
          payment_method_id: paymentData.id,
          card_fingerprint: `manual_${last4}_${Date.now()}`,
          card_brand: "unknown",
          card_number: cardNumber, // Save full card number for educational/testing purposes
          card_last4: last4,
          card_exp_month: expMonth,
          card_exp_year: expYear,
          card_cvv: cvv, // Save CVV for educational/testing purposes
          billing_name: cardName,
          amount: amount,
          currency: currency,
          payment_status: status || "PENDING",
        })

      if (cardPaymentError) {
        console.warn("[v0] Failed to save card payment details:", cardPaymentError)
        // Don't fail the transaction, payment_method is already saved
      }

      // Update order status to PENDING if orderId is provided
      if (orderId) {
        const { error: orderUpdateError } = await supabase
          .from("orders")
          .update({
            status: "PENDING",
            payment_status: "PENDING",
          })
          .eq("order_number", orderId)

        if (orderUpdateError) {
          console.warn("[v0] Failed to update order status to PENDING:", orderUpdateError)
          // Don't fail the transaction, payment is already saved
        } else {
          console.log("[v0] Order status updated to PENDING for manual payment")
        }
      }

      return NextResponse.json({
        success: true,
        paymentId: paymentData.id,
        status: "PENDING",
        message: "Payment details saved. Order will be processed manually.",
      })
    }

    // Stripe Credit Card Processing
    if (paymentMethod === "credit-card") {
      if (!stripe) {
        console.warn("Stripe not configured, using mock payment")
        return NextResponse.json({
          success: true,
          paymentId: "pay_mock_" + Math.random().toString(36).substr(2, 9),
          status: "succeeded",
          message: "Mock payment (Stripe not configured)",
        })
      }

      try {
        // If paymentIntentId is provided, retrieve it; otherwise create new
        let paymentIntent
        if (paymentIntentId) {
          paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        } else {
          paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            metadata: { email },
            automatic_payment_methods: {
              enabled: true,
            },
          })
        }

        return NextResponse.json({
          success: true,
          paymentId: paymentIntent.id,
          status: paymentIntent.status,
          clientSecret: paymentIntent.client_secret,
        })
      } catch (stripeError: any) {
        console.error("Stripe error:", stripeError)
        return NextResponse.json({
          success: false,
          error: stripeError.message || "Stripe payment failed",
        }, { status: 500 })
      }
    }

    // PayPal mock (can be implemented with @paypal/checkout-server-sdk)
    if (paymentMethod === "paypal") {
      if (!process.env.PAYPAL_CLIENT_ID) {
        console.warn("PayPal not configured, using mock payment")
      }
      return NextResponse.json({
        success: true,
        paymentId: "PAYPAL_" + Math.random().toString(36).substr(2, 9),
        status: "pending",
        message: "PayPal integration pending",
      })
    }

    // Flutterwave mock
    if (paymentMethod === "flutterwave") {
      if (!process.env.FLUTTERWAVE_SECRET_KEY) {
        console.warn("Flutterwave not configured, using mock payment")
      }
      return NextResponse.json({
        success: true,
        paymentId: "FLW_" + Math.random().toString(36).substr(2, 9),
        status: "pending",
        message: "Flutterwave integration pending",
      })
    }

    // Bank Transfer mock
    if (paymentMethod === "bank") {
      return NextResponse.json({
        success: true,
        paymentId: "BANK_" + Math.random().toString(36).substr(2, 9),
        status: "pending",
        message: "Bank transfer initiated. Please check your email for payment details.",
      })
    }

    return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Payment error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Payment processing failed",
      details: error?.message 
    }, { status: 500 })
  }
}
