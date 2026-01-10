import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"

// Public endpoint to get all active products
export async function GET() {
  try {
    const supabase = await getSupabaseServiceRole()

    const { data: products, error } = await supabase
      .from("products")
      .select(`
        id,
        slug,
        name,
        description,
        type,
        status,
        category_id,
        price,
        currency,
        stock,
        in_stock,
        tax_percentage,
        shipping_price,
        image,
        images,
        badge,
        dimensions,
        materials,
        colors,
        specifications,
        attributes,
        created_at,
        updated_at,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[Products API] Error:", error)
      throw error
    }

    // Normalize products
    const normalizedProducts = products?.map(product => ({
      ...product,
      category: product.categories?.name || "Uncategorized"
    })) || []

    return NextResponse.json({ 
      success: true, 
      products: normalizedProducts
    })
  } catch (error: any) {
    console.error("[Products API] Failed:", error)
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
