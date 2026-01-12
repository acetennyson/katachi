import { NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth"

function basicAuthHeader(email: string, token: string): string {
  const encoded = Buffer.from(`${email}:${token}`).toString("base64")
  return `Basic ${encoded}`
}

function normalizeSiteUrl(raw: string): string {
  const url = raw.replace(/\/$/, "")
  return url.endsWith("/wiki") ? url.slice(0, -4) : url
}

async function getSetting<T = any>(key: string): Promise<T | null> {
  const supabase = await getSupabaseServiceRole()
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).single()
  return (data?.value as T) ?? null
}

/**
 * POST /api/admin/atlassian/test
 * Tests Jira + Confluence connectivity with current stored credentials.
 */
export async function POST() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const siteUrlRaw = await getSetting<string>("atlassian_site_url")
  const email = await getSetting<string>("atlassian_email")
  const token = await getSetting<string>("atlassian_api_token")

  if (!siteUrlRaw || !email || !token) {
    return NextResponse.json({
      success: false,
      error: "Missing atlassian_site_url, atlassian_email, or atlassian_api_token",
    })
  }

  const siteUrl = normalizeSiteUrl(siteUrlRaw)
  const authHeader = basicAuthHeader(email, token)

  const results: any = { jira: null, confluence: null }
  const debug: any = {
    siteUrl,
    email,
    hasToken: !!token,
    tokenPrefix: token ? token.substring(0, 6) + "..." : "none",
  }

  // Jira: /myself
  try {
    const jiraUrl = `${siteUrl}/rest/api/3/myself`
    debug.jiraUrl = jiraUrl
    const r = await fetch(jiraUrl, {
      headers: { Authorization: authHeader, Accept: "application/json" },
      // @ts-ignore
      cache: "no-store",
    })
    const body = await r.text()
    results.jira = { ok: r.ok, status: r.status, body: r.ok ? JSON.parse(body) : body }
  } catch (e: any) {
    results.jira = { ok: false, error: e?.message }
  }

  // Confluence: /wiki/rest/api/user/current
  try {
    const confluenceUrl = `${siteUrl}/wiki/rest/api/user/current`
    debug.confluenceUrl = confluenceUrl
    const r = await fetch(confluenceUrl, {
      headers: { Authorization: authHeader, Accept: "application/json" },
      // @ts-ignore
      cache: "no-store",
    })
    const body = await r.text()
    results.confluence = { ok: r.ok, status: r.status, body: r.ok ? JSON.parse(body) : body }
  } catch (e: any) {
    results.confluence = { ok: false, error: e?.message }
  }

  const ok = !!(results.jira?.ok && results.confluence?.ok)

  return NextResponse.json({ success: ok, results, debug })
}
