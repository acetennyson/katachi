import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * GET /api/admin/chat-logs
 * Get chat logs for analytics
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "50")
    const source = searchParams.get("source") // 'knowledge_base', 'ai', or 'fallback'

    let query = supabase
      .from("chat_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (source) {
      query = query.eq("source", source)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Get stats
    const { data: stats } = await supabase.rpc("get_chat_stats")

    return NextResponse.json({ data, stats })
  } catch (error: any) {
    console.error("[Admin Chat Logs] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch chat logs" },
      { status: 500 }
    )
  }
}
