import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG, WebP and GIF are allowed" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServiceRole()

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split('.').pop()
    const fileName = `products/${timestamp}-${randomString}.${fileExt}`

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("product-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      })

    if (error) {
      console.error("[Image Upload] Storage error:", error)
      return NextResponse.json(
        { success: false, error: "Failed to upload image", details: error.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: data.path,
      message: "Image uploaded successfully",
    })
  } catch (error: any) {
    console.error("[Image Upload] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to upload image", details: error?.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get("fileName")

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "No file name provided" },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServiceRole()

    const { error } = await supabase.storage
      .from("product-images")
      .remove([fileName])

    if (error) {
      console.error("[Image Delete] Storage error:", error)
      return NextResponse.json(
        { success: false, error: "Failed to delete image", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    })
  } catch (error: any) {
    console.error("[Image Delete] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete image", details: error?.message },
      { status: 500 }
    )
  }
}
