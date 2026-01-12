import { getSupabaseServiceRole } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"
import settings from "@/lib/constants/settings"
import { requireAdmin } from "@/lib/auth"
import { logAdminActivity, extractRequestMetadata } from "@/lib/admin-activity"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const auth = await requireAdmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const body = await request.json()
    const supabase = await getSupabaseServiceRole()

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        slug: body.slug,
        name: body.name,
        description: body.description || null,
        type: body.type,
        category_id: body.category_id,
        status: body.status || "DRAFT",
        price: body.price,
        currency: body.currency || "EUR",
        stock: body.stock || 0,
        in_stock: body.in_stock !== undefined ? body.in_stock : true,
        tax_percentage: body.tax_percentage || settings.defaults.taxPercentage,
        shipping_price: body.shipping_price || settings.defaults.shippingPrice,
        image: body.image,
        images: body.images || [],
        materials: body.materials || [],
        dimensions: body.dimensions,
        colors: body.colors || [],
        badge: body.badge,
        specifications: body.specifications || [],
        attributes: body.attributes || {},
        media: body.media || {},
        created_by: auth.user.id, // Track who created this product
        updated_by: auth.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("[Products Upload API] Error:", error)
      throw error
    }

    // Log activity
    const metadata = extractRequestMetadata(request.headers)
    await logAdminActivity({
      adminId: auth.user.id,
      action: "product_created",
      resourceType: "product",
      resourceId: product.id.toString(),
      details: { productName: body.name, productSlug: body.slug },
      ...metadata,
    })

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error("[Products Upload API] Failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create product",
        details: error?.message,
      },
      { status: 500 }
    )
  }
}
