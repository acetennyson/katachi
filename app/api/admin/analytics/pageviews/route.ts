import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServiceRole()
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get page view events
    const { data: pageViews, error } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("type", "page_view")
      .gte("occurred_at", startDate.toISOString())
      .order("occurred_at", { ascending: false })

    if (error) throw error

    // Get page duration events
    const { data: durations } = await supabase
      .from("analytics_events")
      .select("*")
      .eq("type", "page_duration")
      .gte("occurred_at", startDate.toISOString())

    // Aggregate by page
    const pageStats: Record<string, {
      views: number
      uniqueVisitors: Set<string>
      avgDuration: number[]
      devices: Record<string, number>
      bounces: number
    }> = {}

    pageViews?.forEach(event => {
      const page = event.payload?.page || event.payload?.url || "/"
      
      if (!pageStats[page]) {
        pageStats[page] = {
          views: 0,
          uniqueVisitors: new Set(),
          avgDuration: [],
          devices: {},
          bounces: 0,
        }
      }

      pageStats[page].views++
      if (event.device_id) {
        pageStats[page].uniqueVisitors.add(event.device_id)
      }
      if (event.device_type) {
        pageStats[page].devices[event.device_type] = (pageStats[page].devices[event.device_type] || 0) + 1
      }
    })

    // Add duration data from page_duration events
    durations?.forEach(event => {
      const page = event.payload?.page || "/"
      const duration = event.payload?.duration
      
      if (pageStats[page] && duration) {
        pageStats[page].avgDuration.push(duration)
      }
    })

    // Convert to array and calculate averages
    const topPages = Object.entries(pageStats)
      .map(([page, stats]) => ({
        page,
        views: stats.views,
        uniqueVisitors: stats.uniqueVisitors.size,
        avgDuration: stats.avgDuration.length > 0 
          ? Math.round(stats.avgDuration.reduce((a, b) => a + b, 0) / stats.avgDuration.length)
          : 0,
        devices: stats.devices,
      }))
      .sort((a, b) => b.views - a.views)

    // Get entry pages (first page in sessions)
    const sessionEntryPages: Record<string, number> = {}
    const sessionsBySessionId: Record<string, any[]> = {}
    
    pageViews?.forEach(event => {
      const sessionId = event.session_id
      if (!sessionsBySessionId[sessionId]) {
        sessionsBySessionId[sessionId] = []
      }
      sessionsBySessionId[sessionId].push(event)
    })

    Object.values(sessionsBySessionId).forEach(sessionEvents => {
      const sorted = sessionEvents.sort((a, b) => 
        new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
      )
      if (sorted.length > 0) {
        const entryPage = sorted[0].payload?.page || "/"
        sessionEntryPages[entryPage] = (sessionEntryPages[entryPage] || 0) + 1
      }
    })

    // Get exit pages (last page in sessions)
    const sessionExitPages: Record<string, number> = {}
    
    Object.values(sessionsBySessionId).forEach(sessionEvents => {
      const sorted = sessionEvents.sort((a, b) => 
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
      )
      if (sorted.length > 0) {
        const exitPage = sorted[0].payload?.page || "/"
        sessionExitPages[exitPage] = (sessionExitPages[exitPage] || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        topPages: topPages.slice(0, 50),
        totalPageViews: pageViews?.length || 0,
        uniquePages: Object.keys(pageStats).length,
        entryPages: Object.entries(sessionEntryPages)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([page, count]) => ({ page, count })),
        exitPages: Object.entries(sessionExitPages)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([page, count]) => ({ page, count })),
      },
    })
  } catch (error: any) {
    console.error("[Page Views API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch page views", details: error?.message },
      { status: 500 }
    )
  }
}
