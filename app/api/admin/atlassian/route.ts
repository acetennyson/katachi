import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole, getSupabaseServer } from "@/lib/supabase"

async function requireAdmin() {
  const supabase = await getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { ok: false, status: 401 as const, message: "Unauthorized" }

  const sr = await getSupabaseServiceRole()
  const { data: profile } = await sr.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "ADMIN") return { ok: false, status: 403 as const, message: "Forbidden" }

  return { ok: true as const, user }
}

/**
 * GET /api/admin/atlassian
 * Returns current Atlassian integration settings (token masked)
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const supabase = await getSupabaseServiceRole()
  const keys = [
    "atlassian_support_enabled",
    "atlassian_site_url",
    "atlassian_email",
    "atlassian_api_token",
    "atlassian_confluence_space_keys",
    "atlassian_jira_project_keys",
  ]

  const { data, error } = await supabase.from("site_settings").select("key,value").in("key", keys)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const obj: Record<string, any> = {}
  for (const row of data ?? []) obj[row.key] = row.value

  const token: string = obj.atlassian_api_token || ""
  obj.atlassian_api_token = token ? "********" : ""

  return NextResponse.json({ success: true, settings: obj }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    }
  })
}

/**
 * PUT /api/admin/atlassian
 * Saves Atlassian integration settings (including new token)
 */
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const body = await req.json()

  const updates: Array<{ key: string; value: any; description?: string }> = [
    { key: "atlassian_support_enabled", value: !!body.atlassian_support_enabled },
    { key: "atlassian_site_url", value: body.atlassian_site_url || "" },
    { key: "atlassian_email", value: body.atlassian_email || "" },
    { key: "atlassian_confluence_space_keys", value: body.atlassian_confluence_space_keys || [] },
    { key: "atlassian_jira_project_keys", value: body.atlassian_jira_project_keys || [] },
  ]

  // Only update token if a non-masked token is provided
  if (body.atlassian_api_token && body.atlassian_api_token !== "********") {
    updates.push({ key: "atlassian_api_token", value: body.atlassian_api_token })
  }

  const supabase = await getSupabaseServiceRole()

  for (const u of updates) {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: u.key, value: u.value, updated_at: new Date().toISOString() }, { onConflict: "key" })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
