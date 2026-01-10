import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"

// Public endpoint to get all categories
export async function GET() {
  try {
    const supabase = await getSupabaseServiceRole()

    const { data: categories, error } = await supabase
      .from("categories")
      .select("id, name, slug, description, image, tags")
      .order("name", { ascending: true })

    if (error) {
      console.error("[Categories API] Error:", error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      categories: categories || [] 
    })
  } catch (error: any) {
    console.error("[Categories API] Failed:", error)
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
