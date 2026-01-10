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

    // Get all events
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("*")
      .gte("occurred_at", startDate.toISOString())
      .order("occurred_at", { ascending: true })

    if (error) throw error

    // Event type distribution
    const eventTypes: Record<string, number> = {}
    events?.forEach(event => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1
    })

    // User journey analysis - group by session
    const sessionJourneys: Record<string, any[]> = {}
    events?.forEach(event => {
      const sessionId = event.session_id
      if (!sessionJourneys[sessionId]) {
        sessionJourneys[sessionId] = []
      }
      sessionJourneys[sessionId].push(event)
    })

    // Calculate session metrics
    const sessionMetrics = Object.entries(sessionJourneys).map(([sessionId, sessionEvents]) => {
      const sorted = sessionEvents.sort((a, b) => 
        new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
      )
      
      const firstEvent = sorted[0]
      const lastEvent = sorted[sorted.length - 1]
      const duration = (new Date(lastEvent.occurred_at).getTime() - new Date(firstEvent.occurred_at).getTime()) / 1000
      
      return {
        sessionId,
        events: sorted.length,
        duration,
        deviceType: firstEvent.device_type,
        browser: firstEvent.browser,
        journey: sorted.map(e => e.type),
      }
    })

    // Calculate average session length
    const avgSessionLength = sessionMetrics.reduce((acc, s) => acc + s.events, 0) / sessionMetrics.length || 0
    const avgSessionDuration = sessionMetrics.reduce((acc, s) => acc + s.duration, 0) / sessionMetrics.length || 0

    // Most common user journeys (first 3 events)
    const journeyPatterns: Record<string, number> = {}
    sessionMetrics.forEach(session => {
      const pattern = session.journey.slice(0, 3).join(" → ")
      journeyPatterns[pattern] = (journeyPatterns[pattern] || 0) + 1
    })

    const topJourneys = Object.entries(journeyPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }))

    // Click events analysis
    const clickEvents = events?.filter(e => e.type === "click") || []
    const clickTargets: Record<string, number> = {}
    clickEvents.forEach(event => {
      const target = event.payload?.element || event.payload?.target || "unknown"
      clickTargets[target] = (clickTargets[target] || 0) + 1
    })

    // Product interactions
    const productViews = events?.filter(e => e.type === "product_view") || []
    const productClicks = events?.filter(e => e.type === "product_click") || []
    const addToCarts = events?.filter(e => e.type === "add_to_cart") || []

    // Search queries
    const searchEvents = events?.filter(e => e.type === "search") || []
    const searchQueries: Record<string, number> = {}
    searchEvents.forEach(event => {
      const query = event.payload?.query || ""
      if (query) {
        searchQueries[query] = (searchQueries[query] || 0) + 1
      }
    })

    const topSearches = Object.entries(searchQueries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }))

    return NextResponse.json({
      success: true,
      data: {
        eventTypes,
        totalEvents: events?.length || 0,
        totalSessions: sessionMetrics.length,
        avgSessionLength: Math.round(avgSessionLength),
        avgSessionDuration: Math.round(avgSessionDuration),
        topJourneys,
        topClicks: Object.entries(clickTargets)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([target, count]) => ({ target, count })),
        productInteractions: {
          views: productViews.length,
          clicks: productClicks.length,
          addToCarts: addToCarts.length,
        },
        topSearches,
      },
    })
  } catch (error: any) {
    console.error("[Behavior Analytics API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch behavior analytics", details: error?.message },
      { status: 500 }
    )
  }
}
