import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { logAdminActivity, extractRequestMetadata } from "@/lib/admin-activity"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const auth = await requireAdmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const { id } = await params
    const supabase = await getSupabaseServiceRole()
    const isSuperAdmin = auth.user.role === "SUPERADMIN"

    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("[Admin Product API] Error:", error)
      throw error
    }

    // ADMIN can only view their own products
    if (!isSuperAdmin && product.created_by !== auth.user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only view your own products" },
        { status: 403 }
      )
    }

    // Log activity
    const metadata = extractRequestMetadata(request.headers)
    await logAdminActivity({
      adminId: auth.user.id,
      action: "order_viewed",
      resourceType: "product",
      resourceId: id,
      ...metadata,
    })

    return NextResponse.json({ 
      success: true, 
      product 
    })
  } catch (error: any) {
    console.error("[Admin Product API] Failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch product",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const auth = await requireAdmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const { id } = await params
    const body = await request.json()
    const supabase = await getSupabaseServiceRole()
    const isSuperAdmin = auth.user.role === "SUPERADMIN"

    // Check ownership - ADMIN can only edit their own products
    if (!isSuperAdmin) {
      const { data: existing } = await supabase
        .from("products")
        .select("created_by")
        .eq("id", id)
        .single()

      if (existing && existing.created_by !== auth.user.id) {
        return NextResponse.json(
          { error: "Forbidden - You can only edit your own products" },
          { status: 403 }
        )
      }
    }

    const { data: product, error } = await supabase
      .from("products")
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description,
        type: body.type,
        category_id: body.category_id,
        status: body.status,
        price: body.price,
        currency: body.currency,
        stock: body.stock,
        in_stock: body.in_stock,
        tax_percentage: body.tax_percentage,
        shipping_price: body.shipping_price,
        image: body.image,
        images: body.images,
        materials: body.materials,
        dimensions: body.dimensions,
        colors: body.colors,
        badge: body.badge,
        specifications: body.specifications,
        attributes: body.attributes,
        updated_by: auth.user.id, // Track who updated
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Admin Product Update API] Error:", error)
      throw error
    }

    // Log activity
    const metadata = extractRequestMetadata(request.headers)
    await logAdminActivity({
      adminId: auth.user.id,
      action: "product_updated",
      resourceType: "product",
      resourceId: id,
      details: { productName: body.name },
      ...metadata,
    })

    return NextResponse.json({ 
      success: true, 
      product 
    })
  } catch (error: any) {
    console.error("[Admin Product Update API] Failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update product",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const auth = await requireAdmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const { id } = await params
    const supabase = await getSupabaseServiceRole()
    const isSuperAdmin = auth.user.role === "SUPERADMIN"

    // Get product details before deletion
    const { data: product } = await supabase
      .from("products")
      .select("created_by, name")
      .eq("id", id)
      .single()

    // Check ownership - ADMIN can only delete their own products
    if (!isSuperAdmin && product && product.created_by !== auth.user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only delete your own products" },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[Admin Product Delete API] Error:", error)
      throw error
    }

    // Log activity
    const metadata = extractRequestMetadata(request.headers)
    await logAdminActivity({
      adminId: auth.user.id,
      action: "product_deleted",
      resourceType: "product",
      resourceId: id,
      details: { productName: product?.name },
      ...metadata,
    })

    return NextResponse.json({ 
      success: true,
      message: "Product deleted successfully"
    })
  } catch (error: any) {
    console.error("[Admin Product Delete API] Failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete product",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}
