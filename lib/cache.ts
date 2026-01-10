import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

export async function cacheGet(key: string) {
  const { data } = await supabase.from("cache").select("value").eq("key", key).single()

  if (!data) return null

  if (new Date(data.expires_at) < new Date()) {
    await supabase.from("cache").delete().eq("key", key)
    return null
  }

  return data.value
}

export async function cacheSet(key: string, value: any, ttl = 3600) {
  const expiresAt = new Date(Date.now() + ttl * 1000)

  await supabase.from("cache").upsert({
    key,
    value,
    expires_at: expiresAt.toISOString(),
  })
}

export async function cacheDel(key: string) {
  await supabase.from("cache").delete().eq("key", key)
}
