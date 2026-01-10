import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServiceRole()

    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("[Admin Product API] Error:", error)
      throw error
    }

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
    const { id } = await params
    const body = await request.json()
    const supabase = await getSupabaseServiceRole()

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
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Admin Product Update API] Error:", error)
      throw error
    }

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
    const { id } = await params
    const supabase = await getSupabaseServiceRole()

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[Admin Product Delete API] Error:", error)
      throw error
    }

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
