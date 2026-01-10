import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServiceRole()

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("[Admin Order API] Error:", error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      order 
    })
  } catch (error: any) {
    console.error("[Admin Order API] Failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch order",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await getSupabaseServiceRole()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.status) updateData.status = body.status
    if (body.payment_status) updateData.payment_status = body.payment_status

    const { data: order, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Admin Order Update API] Error:", error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      order 
    })
  } catch (error: any) {
    console.error("[Admin Order Update API] Failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update order",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}
