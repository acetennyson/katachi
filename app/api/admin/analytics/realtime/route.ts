import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServiceRole()
    
    // Get events from last 5 minutes for real-time data
    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

    const { data: recentEvents, error } = await supabase
      .from("analytics_events")
      .select("*")
      .gte("occurred_at", fiveMinutesAgo.toISOString())
      .order("occurred_at", { ascending: false })

    if (error) throw error

    // Count active sessions (unique session_ids in last 5 minutes)
    const activeSessions = new Set(recentEvents?.map(e => e.session_id)).size

    // Current page views
    const pageViews = recentEvents?.filter(e => e.type === "page_view") || []
    
    // Active pages
    const activePages: Record<string, number> = {}
    pageViews.forEach(event => {
      const page = event.payload?.page || "unknown"
      activePages[page] = (activePages[page] || 0) + 1
    })

    // Recent activity stream (last 20 events)
    const activityStream = recentEvents?.slice(0, 20).map(event => ({
      id: event.id,
      type: event.type,
      page: event.payload?.page,
      timestamp: event.occurred_at,
      device: event.device_type,
      browser: event.browser,
      country: event.country,
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        activeSessions,
        activePages,
        totalEvents: recentEvents?.length || 0,
        activityStream,
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("[Analytics Realtime API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch realtime analytics", details: error?.message },
      { status: 500 }
    )
  }
}
