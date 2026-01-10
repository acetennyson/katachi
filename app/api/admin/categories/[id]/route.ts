import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServiceRole()

    const { data: category, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("[Admin Category API] Error:", error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      category 
    })
  } catch (error: any) {
    console.error("[Admin Category API] Failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch category",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = await getSupabaseServiceRole()

    const { data: category, error } = await supabase
      .from("categories")
      .update({
        name: body.name,
        slug: body.slug,
        description: body.description,
        tags: body.tags || [],
        image: body.image,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[Admin Category Update API] Error:", error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      category 
    })
  } catch (error: any) {
    console.error("[Admin Category Update API] Failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update category",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServiceRole()

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[Admin Category Delete API] Error:", error)
      throw error
    }

    return NextResponse.json({ 
      success: true,
      message: "Category deleted successfully"
    })
  } catch (error: any) {
    console.error("[Admin Category Delete API] Failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete category",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}
