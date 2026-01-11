import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseServiceRole } from "@/lib/supabase"
import { chatWithFallback } from "@/lib/ai-providers"

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

/**
 * POST /api/admin/ai-providers/test
 * Runs a short prompt through the fallback chain to confirm a provider is working.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const body = await req.json().catch(() => ({}))
  const prompt = body.prompt || "Say 'OK' and nothing else."

  try {
    const result = await chatWithFallback([
      { role: "system", content: "You are a test assistant. Keep it extremely short." },
      { role: "user", content: prompt },
    ])

    return NextResponse.json({ success: true, result })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) })
  }
}
