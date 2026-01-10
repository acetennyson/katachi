import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServiceRole()

    // Fetch all products
    const { data: products, error } = await supabase
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
        updated_at
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Admin Products API] Error:", error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      products: products || [] 
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
