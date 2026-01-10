import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServiceRole()

    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("[Admin Categories API] Error:", error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      categories: categories || [] 
    })
  } catch (error: any) {
    console.error("[Admin Categories API] Failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch categories",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await getSupabaseServiceRole()

    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description,
        tags: body.tags || [],
        image: body.image,
      })
      .select()
      .single()

    if (error) {
      console.error("[Admin Categories Create API] Error:", error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      category 
    })
  } catch (error: any) {
    console.error("[Admin Categories Create API] Failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create category",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}
