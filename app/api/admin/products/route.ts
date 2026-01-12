import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    // Check authentication
    const auth = await requireAdmin()
    if (!auth.ok) {
      console.warn('[API /admin/products] Auth failed:', auth)
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const supabase = await getSupabaseServiceRole()
    const isSuperAdmin = auth.user.role === "SUPERADMIN"

    // Build query based on role
    let query = supabase
      .from("products")
      .select(`
        id,
        slug,
        name,
        description,
        type,
        status,
        price,
        currency,
        stock,
        tax_percentage,
        shipping_price,
        attributes,
        media,
        created_at,
        updated_at,
        created_by,
        updated_by
      `)
      .order("created_at", { ascending: false })

    // ADMIN role: only see their own products
    // SUPERADMIN: see all products
    if (!isSuperAdmin) {
      query = query.eq("created_by", auth.user.id)
    }

    const { data: products, error } = await query

    if (error) {
      console.error("[Admin Products API] Error:", error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      products: products || [],
      userRole: auth.user.role
    })
  } catch (error: any) {
    console.error("[Admin Products API] Failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch products",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}
