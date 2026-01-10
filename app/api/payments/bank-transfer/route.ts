import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase"

// Bank transfer payment processing
export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, currency, userEmail, userName } = await request.json()

    if (!orderId || !amount || !userEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Bank transfer initiated for order:", orderId)

    // Generate bank transfer reference
    const transferReference = `REF-${orderId}-${Date.now().toString(36).toUpperCase()}`

    // Bank details (replace with your actual bank details)
    const bankDetails = {
      accountName: "Katachi Furniture Store",
      accountNumber: "BE68 5390 0754 7034",
      bankName: "BNP Paribas Fortis",
      bic: "GKCCBEBB",
      reference: transferReference,
      amount: amount,
      currency: currency || "EUR",
    }

    // Update order status in database
    const supabase = await getSupabaseServiceRole()
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "PENDING",
        payment_method: "BANK_TRANSFER",
        payment_reference: transferReference,
        status: "PENDING_PAYMENT",
        updated_at: new Date().toISOString(),
      })
      .eq("order_number", orderId)

    if (updateError) {
      console.error("Failed to update order:", updateError)
    }

    // In production, you would send an email with bank details
    console.log("[v0] Bank transfer details:", bankDetails)

    // TODO: Send email with bank transfer instructions
    // Example:
    // await sendBankTransferEmail({
    //   to: userEmail,
    //   orderNumber: orderId,
    //   amount: amount,
    //   currency: currency,
    //   bankDetails: bankDetails,
    // })

    return NextResponse.json({
      success: true,
      bankDetails: bankDetails,
      reference: transferReference,
      message: "Bank transfer instructions generated",
    })
  } catch (error: any) {
    console.error("Bank transfer error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to process bank transfer",
      details: error?.message,
    }, { status: 500 })
  }
}

// GET - Check bank transfer status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ error: "Reference required" }, { status: 400 })
    }

    const supabase = await getSupabaseServiceRole()
    const { data: order, error } = await supabase
      .from("orders")
      .select("payment_status, status")
      .eq("payment_reference", reference)
      .single()

    if (error) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      paymentStatus: order.payment_status,
      orderStatus: order.status,
    })
  } catch (error: any) {
    console.error("Bank transfer status check error:", error)
    return NextResponse.json({
      success: false,
      error: "Failed to check status",
    }, { status: 500 })
  }
}
