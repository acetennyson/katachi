import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseServiceRole } from "@/lib/supabase"
import type { ProviderName } from "@/lib/ai-providers"

async function requireAdmin() {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, status: 401 as const, message: "Unauthorized" }

  const sr = await getSupabaseServiceRole()
  const { data: profile } = await sr.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "ADMIN") return { ok: false, status: 403 as const, message: "Forbidden" }

  return { ok: true as const }
}

const KEYS = [
  "ai_provider_order",
  "ai_provider_enabled",
  "huggingface_api_key",
  "huggingface_model",
  "groq_api_key",
  "groq_model",
  "gemini_api_key",
  "gemini_model",
  "together_api_key",
  "together_model",
  "openai_api_key",
  "openai_model",
] as const

/**
 * GET /api/admin/ai-providers
 * Returns provider config (keys masked)
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const sr = await getSupabaseServiceRole()
  const { data, error } = await sr.from("site_settings").select("key,value").in("key", KEYS as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const settings: Record<string, any> = {}
  for (const row of data ?? []) settings[row.key] = row.value

  console.log('[API GET] Raw settings from DB:', JSON.stringify(settings, null, 2))
  console.log('[API GET] ai_provider_enabled:', settings.ai_provider_enabled)

  // mask keys
  for (const k of ["huggingface_api_key", "groq_api_key", "gemini_api_key", "together_api_key", "openai_api_key"]) {
    const v = settings[k] as string
    settings[k] = v ? "********" : ""
  }

  console.log('[API GET] Returning settings:', JSON.stringify(settings, null, 2))

  return NextResponse.json({ success: true, settings }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    }
  })
}

/**
 * PUT /api/admin/ai-providers
 * Update provider config (only updates api_key if not masked)
 */
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const body = await req.json()
  console.log('[API PUT] Received body:', JSON.stringify(body, null, 2))
  console.log('[API PUT] ai_provider_enabled:', body.ai_provider_enabled)

  const sr = await getSupabaseServiceRole()

  async function upsert(key: string, value: any) {
    const { error } = await sr
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
    if (error) throw error
  }

  const order = (body.ai_provider_order as ProviderName[]) || ["huggingface", "groq", "gemini", "together", "openai"]
  const enabled = body.ai_provider_enabled || {}

  await upsert("ai_provider_order", order)
  await upsert("ai_provider_enabled", enabled)

  await upsert("huggingface_model", body.huggingface_model || "meta-llama/Llama-3.2-3B-Instruct")
  await upsert("groq_model", body.groq_model || "llama-3.1-8b-instant")
  await upsert("gemini_model", body.gemini_model || "gemini-1.5-flash")
  await upsert("together_model", body.together_model || "meta-llama/Llama-3.1-8B-Instruct-Turbo")
  await upsert("openai_model", body.openai_model || "gpt-4o-mini")

  const keyFields = [
    "huggingface_api_key",
    "groq_api_key",
    "gemini_api_key",
    "together_api_key",
    "openai_api_key",
  ]

  for (const k of keyFields) {
    const v = body[k]
    if (typeof v === "string" && v && v !== "********") {
      await upsert(k, v)
    }
  }

  return NextResponse.json({ success: true })
}
