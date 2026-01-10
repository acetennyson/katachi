import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

export const uploadFile = async (
  file: File,
  bucket: string,
  path: string,
): Promise<{ url: string; error: null } | { url: null; error: string }> => {
  try {
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `${path}/${fileName}`

    const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("[v0] Upload error:", error)
      return { url: null, error: error.message }
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)

    return { url: data.publicUrl, error: null }
  } catch (err) {
    console.error("[v0] Storage error:", err)
    return { url: null, error: String(err) }
  }
}

export const deleteFile = async (bucket: string, path: string): Promise<{ success: boolean; error: string | null }> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
