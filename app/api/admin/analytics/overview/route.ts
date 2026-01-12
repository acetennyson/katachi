import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }
    const supabase = await getSupabaseServiceRole()
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")
    const customStartDate = searchParams.get("startDate")
    const customEndDate = searchParams.get("endDate")
    
    let startDate: Date
    if (customStartDate) {
      startDate = new Date(customStartDate)
    } else {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
    }
    
    let endDate: Date = customEndDate ? new Date(customEndDate) : new Date()

    // If ADMIN, restrict analytics to their products where possible
    let productIds: string[] = []
    const isSuper = auth.user.role === "SUPERADMIN"

    if (!isSuper) {
      const { data: adminProducts } = await supabase
        .from("products")
        .select("id")
        .eq("created_by", auth.user.id)
      productIds = (adminProducts || []).map((p: any) => p.id)
    }

    // Get events: if schema has product_id, filter to those products; otherwise we will compute only order-based metrics for admins
    let eventsQuery = supabase
      .from("analytics_events")
      .select("*")
      .gte("occurred_at", startDate.toISOString())

    if (customEndDate) {
      eventsQuery = eventsQuery.lte("occurred_at", endDate.toISOString())
    }

    // Try to narrow by product_id if present
    if (!isSuper && productIds.length > 0) {
      // Some events may include product_id; narrowing will only affect those
      // If column does not exist, Supabase will error; we ignore by catching below
      try {
        eventsQuery = (eventsQuery as any).in("product_id", productIds)
      } catch {}
    }

    const { data: allEvents, error: eventsError } = await eventsQuery
      .order("occurred_at", { ascending: false })

    if (eventsError) throw eventsError

    // Get orders for revenue calculation
    let orders: any[] | null = null

    if (isSuper) {
      const { data } = await supabase
        .from("orders")
        .select("id, total, created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
      orders = data
    } else {
      if (productIds.length === 0) {
        orders = []
      } else {
        // 1) order_items for these products within date range (approx via order created_at after)
        const { data: items } = await supabase
          .from("order_items")
          .select("order_id")
          .in("product_id", productIds)

        const orderIds = Array.from(new Set((items || []).map((i: any) => i.order_id)))
        if (orderIds.length === 0) {
          orders = []
        } else {
          const { data } = await supabase
            .from("orders")
            .select("id, total, created_at")
            .in("id", orderIds)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString())
          orders = data || []
        }
      }
    }

    const recentEvents = allEvents?.slice(0, 100) || []

    // Calculate metrics from events
    const uniqueSessions = new Set(allEvents?.map(e => e.session_id).filter(Boolean))
    const uniqueVisitors = new Set(allEvents?.map(e => e.device_id).filter(Boolean))
    const pageViewEvents = allEvents?.filter(e => e.type === 'page_view') || []
    const purchaseEvents = allEvents?.filter(e => e.type === 'purchase' || e.type === 'checkout_complete') || []
    
    // Calculate session durations
    const sessionTimes: Record<string, { start: number; end: number; pages: number }> = {}
    allEvents?.forEach(event => {
      const sessionId = event.session_id
      const timestamp = new Date(event.occurred_at).getTime()
      
      if (sessionId) {
        if (!sessionTimes[sessionId]) {
          sessionTimes[sessionId] = { start: timestamp, end: timestamp, pages: 0 }
        }
        sessionTimes[sessionId].start = Math.min(sessionTimes[sessionId].start, timestamp)
        sessionTimes[sessionId].end = Math.max(sessionTimes[sessionId].end, timestamp)
        if (event.type === 'page_view') {
          sessionTimes[sessionId].pages++
        }
      }
    })

    const sessionDurations = Object.values(sessionTimes).map(s => (s.end - s.start) / 1000)
    const avgSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length 
      : 0

    // Calculate bounce rate (sessions with only 1 page view)
    const bouncedSessions = Object.values(sessionTimes).filter(s => s.pages <= 1).length
    const avgBounceRate = uniqueSessions.size > 0 ? (bouncedSessions / uniqueSessions.size) * 100 : 0

    // Calculate pages per session
    const pagesPerSession = uniqueSessions.size > 0 ? pageViewEvents.length / uniqueSessions.size : 0
    
    // Calculate revenue
    const revenue = orders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0
    const ordersCount = orders?.length || 0
    
    // Calculate conversion rate
    const conversionRate = uniqueSessions.size > 0 ? (ordersCount / uniqueSessions.size) * 100 : 0

    const totals = {
      totalSessions: uniqueSessions.size,
      uniqueVisitors: uniqueVisitors.size,
      pageViews: pageViewEvents.length,
      ordersCount,
      revenue,
    }

    // Event type breakdown
    const eventTypes: Record<string, number> = {}
    recentEvents?.forEach(event => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1
    })

    // Device breakdown
    const deviceBreakdown: Record<string, number> = {}
    recentEvents?.forEach(event => {
      if (event.device_type) {
        deviceBreakdown[event.device_type] = (deviceBreakdown[event.device_type] || 0) + 1
      }
    })

    // Browser breakdown
    const browserBreakdown: Record<string, number> = {}
    recentEvents?.forEach(event => {
      if (event.browser) {
        browserBreakdown[event.browser] = (browserBreakdown[event.browser] || 0) + 1
      }
    })

    // Top countries - read from ip_geolocation_cache with visit_count
    const { data: cachedLocations } = await supabase
      .from("ip_geolocation_cache")
      .select("country, visit_count")
      .not("country", "is", null)
      .order("visit_count", { ascending: false })
      .limit(10)
    
    const countryBreakdown: Record<string, number> = {}
    cachedLocations?.forEach(location => {
      if (location.country) {
        countryBreakdown[location.country] = (countryBreakdown[location.country] || 0) + location.visit_count
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totals: {
          ...totals,
          avgSessionDuration: Math.round(avgSessionDuration),
          avgBounceRate: Math.round(avgBounceRate * 100) / 100,
          conversionRate: Math.round(conversionRate * 100) / 100,
          pagesPerSession: Math.round(pagesPerSession * 10) / 10,
        },
        timeline: [],
        eventTypes,
        deviceBreakdown,
        browserBreakdown,
        countryBreakdown: Object.entries(countryBreakdown)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .reduce((acc, [country, count]) => ({ ...acc, [country]: count }), {}),
        recentEvents: recentEvents?.slice(0, 20) || [],
      },
    })
  } catch (error: any) {
    console.error("[Analytics Overview API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics", details: error?.message },
      { status: 500 }
    )
  }
}
