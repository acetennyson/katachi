import { NextRequest, NextResponse } from "next/server"
import { getLemonsqueezyService } from "@/lib/lemonsqueezy-service"
import { getSupabaseServiceRole } from "@/lib/supabase"

// Create Lemonsqueezy checkout
export async function POST(request: NextRequest) {
  try {
    const { amount, currency = "USD", orderId, orderDescription, email, name } = await request.json()

    if (!amount || !orderId) {
      return NextResponse.json({
        success: false,
        error: "Missing required fields (amount, orderId)"
      }, { status: 400 })
    }

    const storeId = process.env.LEMONSQUEEZY_STORE_ID
    const variantId = process.env.LEMONSQUEEZY_VARIANT_ID

    if (!storeId || !variantId) {
      return NextResponse.json({
        success: false,
        error: "Lemonsqueezy store or variant not configured"
      }, { status: 500 })
    }

    console.log("[Lemonsqueezy] Creating checkout:", { amount, currency, orderId })

    const lemonsqueezy = getLemonsqueezyService()
    
    // Convert amount to cents
    const amountInCents = Math.round(amount * 100)

    // Create checkout session
    const checkout = await lemonsqueezy.createCheckout({
      storeId,
      variantId,
      customPrice: amountInCents,
      productOptions: {
        name: orderDescription || `Order ${orderId}`,
        description: `Order ${orderId} - Payment`,
      },
      checkoutOptions: {
        embed: false,
        media: true,
        logo: true,
        desc: true,
        discount: true,
        dark: false,
      },
      checkoutData: {
        email: email,
        name: name,
        custom: {
          order_id: orderId,
        },
      },
    })

    console.log("[Lemonsqueezy] Checkout created:", checkout.id)

    // Update order in database with checkout ID
    const supabase = await getSupabaseServiceRole()
    const { error } = await supabase
      .from("orders")
      .update({
        payment_id: checkout.id,
        payment_status: "PENDING",
        payment_provider: "lemonsqueezy",
      })
      .eq("order_number", orderId)

    if (error) {
      console.error("[Lemonsqueezy] Failed to update order:", error)
    }

    return NextResponse.json({
      success: true,
      checkoutId: checkout.id,
      checkoutUrl: checkout.url,
    })
  } catch (error: any) {
    console.error("[Lemonsqueezy] Error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to create checkout",
      details: error?.message
    }, { status: 500 })
  }
}

// Get checkout/order status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const checkoutId = searchParams.get('checkoutId')
    const orderId = searchParams.get('orderId')

    if (!checkoutId && !orderId) {
      return NextResponse.json({
        success: false,
        error: "Missing checkoutId or orderId"
      }, { status: 400 })
    }

    const lemonsqueezy = getLemonsqueezyService()

    if (checkoutId) {
      const checkout = await lemonsqueezy.getCheckout(checkoutId)
      return NextResponse.json({
        success: true,
        checkout,
      })
    }

    if (orderId) {
      const order = await lemonsqueezy.getOrder(orderId)
      return NextResponse.json({
        success: true,
        order,
      })
    }
  } catch (error: any) {
    console.error("[Lemonsqueezy] Status check error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to check status",
      details: error?.message
    }, { status: 500 })
  }
}
