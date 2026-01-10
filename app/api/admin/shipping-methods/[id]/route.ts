import { getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServiceRole()
    const body = await request.json()
    const { id } = params

    const { data, error } = await supabase
      .from("shipping_methods")
      .update({
        name: body.name,
        description: body.description,
        price: body.price,
        estimated_days: body.estimated_days,
        enabled: body.enabled,
        sort_order: body.sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      method: data,
    })
  } catch (error: any) {
    console.error("[Shipping Method Update API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update shipping method", details: error?.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServiceRole()
    const { id } = params

    const { error } = await supabase
      .from("shipping_methods")
      .delete()
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Shipping method deleted successfully",
    })
  } catch (error: any) {
    console.error("[Shipping Method Delete API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete shipping method", details: error?.message },
      { status: 500 }
    )
  }
}
