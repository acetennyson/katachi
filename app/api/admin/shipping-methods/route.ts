import { getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"
import { requireSuperAdmin } from "@/lib/auth"

export async function GET() {
  try {
    // SUPERADMIN only - shipping methods management
    const auth = await requireSuperAdmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const supabase = await getSupabaseServiceRole()

    const { data: methods, error } = await supabase
      .from("shipping_methods")
      .select("*")
      .order("sort_order")

    if (error) throw error

    return NextResponse.json({
      success: true,
      methods: methods || [],
    })
  } catch (error: any) {
    console.error("[Shipping Methods API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch shipping methods", details: error?.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // SUPERADMIN only - shipping methods management
    const auth = await requireSuperAdmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const supabase = await getSupabaseServiceRole()
    const body = await request.json()

    const { data, error } = await supabase
      .from("shipping_methods")
      .insert({
        id: body.id,
        name: body.name,
        description: body.description,
        price: body.price,
        estimated_days: body.estimated_days,
        enabled: body.enabled,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      method: data,
    })
  } catch (error: any) {
    console.error("[Shipping Methods API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create shipping method", details: error?.message },
      { status: 500 }
    )
  }
}
