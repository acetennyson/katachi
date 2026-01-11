import { getSupabaseServiceRole } from "@/lib/supabase"

export type AtlassianContextResult = {
  confluence: Array<{ title: string; url?: string; excerpt: string }>
  jira: Array<{ key: string; summary: string; status?: string; updated?: string; url?: string; excerpt?: string }>
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function basicAuthHeader(email: string, token: string): string {
  const encoded = Buffer.from(`${email}:${token}`).toString("base64")
  return `Basic ${encoded}`
}

async function getSetting<T = any>(key: string): Promise<T | null> {
  const supabase = await getSupabaseServiceRole()
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).single()
  return (data?.value as T) ?? null
}

function normalizeSiteUrl(raw: string): string {
  // Accept either https://your-domain.atlassian.net or https://your-domain.atlassian.net/wiki
  const url = raw.replace(/\/$/, "")
  return url.endsWith("/wiki") ? url.slice(0, -4) : url
}

export async function fetchAtlassianContext(query: string): Promise<AtlassianContextResult | null> {
  const enabled = await getSetting<boolean>("atlassian_support_enabled")
  if (!enabled) return null

  const siteUrlRaw = await getSetting<string>("atlassian_site_url")
  const email = await getSetting<string>("atlassian_email")
  const token = await getSetting<string>("atlassian_api_token")

  if (!siteUrlRaw || !email || !token) return null

  const siteUrl = normalizeSiteUrl(siteUrlRaw)
  const auth = basicAuthHeader(email, token)

  const confluenceSpaces = (await getSetting<string[]>("atlassian_confluence_space_keys")) ?? []
  const jiraProjects = (await getSetting<string[]>("atlassian_jira_project_keys")) ?? []

  const [confluence, jira] = await Promise.all([
    fetchConfluenceContext({ siteUrl, auth, query, spaceKeys: confluenceSpaces }),
    fetchJiraContext({ siteUrl, auth, query, projectKeys: jiraProjects }),
  ])

  return { confluence, jira }
}

async function fetchConfluenceContext(opts: {
  siteUrl: string
  auth: string
  query: string
  spaceKeys: string[]
}): Promise<AtlassianContextResult["confluence"]> {
  try {
    // Confluence search API lives under /wiki
    // CQL docs: https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql/
    const q = opts.query.replace(/"/g, "\\\"")
    const spaceFilter = opts.spaceKeys.length
      ? ` AND space IN (${opts.spaceKeys.map((k) => `\"${k}\"`).join(",")})`
      : ""

    const cql = `type=page AND (title ~ \"${q}\" OR text ~ \"${q}\")${spaceFilter} ORDER BY lastmodified DESC`

    const url = `${opts.siteUrl}/wiki/rest/api/search?cql=${encodeURIComponent(cql)}&limit=3&expand=content.body.view,content._links.webui`

    const res = await fetch(url, {
      headers: {
        Authorization: opts.auth,
        Accept: "application/json",
      },
      // @ts-ignore
      cache: "no-store",
    })

    if (!res.ok) return []
    const data: any = await res.json()

    const results = (data.results ?? []).map((r: any) => {
      const title = r.content?.title ?? "Untitled"
      const html = r.content?.body?.view?.value ?? ""
      const excerpt = stripHtml(html).slice(0, 700)
      const webui = r.content?._links?.webui
      const url = webui ? `${opts.siteUrl}/wiki${webui}` : undefined
      return { title, url, excerpt }
    })

    return results
  } catch {
    return []
  }
}

async function fetchJiraContext(opts: {
  siteUrl: string
  auth: string
  query: string
  projectKeys: string[]
}): Promise<AtlassianContextResult["jira"]> {
  try {
    // Jira search API: /rest/api/3/search
    const q = opts.query.replace(/"/g, "\\\"")
    const projectFilter = opts.projectKeys.length
      ? ` AND project in (${opts.projectKeys.map((k) => `\"${k}\"`).join(",")})`
      : ""

    // Use text ~ for fuzzy matching in Jira
    const jql = `text ~ \"${q}\"${projectFilter} ORDER BY updated DESC`

    const url = `${opts.siteUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=3&fields=summary,status,updated,description`

    const res = await fetch(url, {
      headers: {
        Authorization: opts.auth,
        Accept: "application/json",
      },
      // @ts-ignore
      cache: "no-store",
    })

    if (!res.ok) return []
    const data: any = await res.json()

    const issues = (data.issues ?? []).map((i: any) => {
      const key = i.key
      const summary = i.fields?.summary ?? ""
      const status = i.fields?.status?.name
      const updated = i.fields?.updated
      // Keep description out by default (can contain internal info). If present, only take a short plain-text excerpt.
      const desc = i.fields?.description
      const excerpt = desc ? JSON.stringify(desc).slice(0, 500) : undefined
      const url = `${opts.siteUrl}/browse/${key}`
      return { key, summary, status, updated, url, excerpt }
    })

    return issues
  } catch {
    return []
  }
}
