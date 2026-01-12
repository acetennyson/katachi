import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"
import { chatWithFallback } from "@/lib/ai-providers"

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
