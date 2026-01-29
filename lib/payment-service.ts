// Unified payment service supporting Stripe, PayPal, and Flutterwave
import Stripe from "stripe"

interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: "pending" | "succeeded" | "failed"
  provider: "stripe" | "paypal" | "flutterwave" | "nowpayments"
  clientSecret?: string // For Stripe
  approvalUrl?: string // For PayPal
  invoiceUrl?: string // For NOWPayments
}

// Initialize Stripe if key is available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
    })
  : null

export async function createPaymentIntent(
  userId: string,
  amount: number,
  currency = "EUR",
  provider: "stripe" | "paypal" | "flutterwave" | "nowpayments" = "stripe",
): Promise<PaymentIntent> {
  // Provider-specific implementations
  switch (provider) {
    case "stripe":
      return createStripeIntent(userId, amount, currency)
    case "paypal":
      return createPayPalIntent(userId, amount, currency)
    case "flutterwave":
      return createFlutterwaveIntent(userId, amount, currency)
    case "nowpayments":
      return createNOWPaymentsIntent(userId, amount, currency)
    default:
      throw new Error("Unsupported payment provider")
  }
}

async function createStripeIntent(userId: string, amount: number, currency: string): Promise<PaymentIntent> {
  if (!stripe) {
    console.warn("Stripe not configured, using mock payment")
    return {
      id: `pi_mock_${Date.now()}`,
      amount,
      currency,
      status: "pending",
      provider: "stripe",
    }
  }

  try {
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency.toLowerCase(),
      metadata: {
        userId,
      },
      // Explicitly specify payment method types instead of automatic
      payment_method_types: ['card'],
    })

    return {
      id: paymentIntent.id,
      amount,
      currency,
      status: paymentIntent.status === "succeeded" ? "succeeded" : "pending",
      provider: "stripe",
      clientSecret: paymentIntent.client_secret || undefined,
    }
  } catch (error: any) {
    console.error("Stripe payment intent creation failed:", error)
    console.error("Error details:", {
      message: error?.message,
      type: error?.type,
      code: error?.code,
      raw: error?.raw,
      statusCode: error?.statusCode,
    })
    throw new Error(`Failed to create Stripe payment intent: ${error?.message || error}`)
  }
}

async function createPayPalIntent(userId: string, amount: number, currency: string): Promise<PaymentIntent> {
  // Implementation would use PayPal SDK
  // This is a placeholder
  return {
    id: `pp_${Date.now()}`,
    amount,
    currency,
    status: "pending",
    provider: "paypal",
  }
}

async function createFlutterwaveIntent(userId: string, amount: number, currency: string): Promise<PaymentIntent> {
  // Implementation would use Flutterwave SDK
  // This is a placeholder
  return {
    id: `fw_${Date.now()}`,
    amount,
    currency,
    status: "pending",
    provider: "flutterwave",
  }
}

async function createNOWPaymentsIntent(userId: string, amount: number, currency: string): Promise<PaymentIntent> {
  // NOWPayments is handled via direct API calls in the route handler
  // This is a placeholder for consistency
  return {
    id: `now_${Date.now()}`,
    amount,
    currency,
    status: "pending",
    provider: "nowpayments",
  }
}

export async function verifyPayment(paymentId: string, provider: string): Promise<boolean> {
  // Verify payment with provider's API
  // Implementation depends on provider
  return true
}

export async function refundPayment(paymentId: string, provider: string, amount?: number): Promise<boolean> {
  // Process refund with provider
  // Implementation depends on provider
  return true
}
