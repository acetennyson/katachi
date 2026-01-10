import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServiceRole()

    // Get today's date and 30 days ago for comparison
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const todayStr = today.toISOString().split('T')[0]
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    // Fetch counts and statistics
    const [
      ordersRes, 
      productsRes, 
      profilesRes,
      todaySummary,
      previousSummary,
      sessionsRes,
      cartAnalyticsRes,
      productAnalyticsRes
    ] = await Promise.all([
      supabase.from("orders").select("id, total, created_at, payment_status", { count: "exact" }),
      supabase.from("products").select("id", { count: "exact" }),
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("analytics_summary").select("*").eq("date", todayStr).single(),
      supabase.from("analytics_summary").select("*").gte("date", thirtyDaysAgoStr).lt("date", todayStr).order("date", { ascending: false }).limit(30),
      supabase.from("user_sessions").select("id, duration_seconds, page_views, is_bounce", { count: "exact" }).gte("started_at", thirtyDaysAgoStr),
      supabase.from("cart_analytics").select("status, total, items_count").gte("created_at", thirtyDaysAgoStr),
      supabase.from("product_analytics").select("views, purchases, revenue").gte("date", thirtyDaysAgoStr)
    ])

    if (ordersRes.error) throw ordersRes.error
    if (productsRes.error) throw productsRes.error
    if (profilesRes.error) throw profilesRes.error

    // Calculate revenue
    const totalRevenue = ordersRes.data?.reduce((sum, order) => 
      sum + parseFloat(order.total || "0"), 0) || 0

    // Calculate revenue from paid orders only
    const paidRevenue = ordersRes.data?.filter(o => o.payment_status === 'PAID')
      .reduce((sum, order) => sum + parseFloat(order.total || "0"), 0) || 0

    // Calculate pending orders
    const pendingOrders = ordersRes.data?.filter(o => o.payment_status === 'PENDING').length || 0

    // Calculate previous period stats for growth
    const previousPeriod = previousSummary.data || []
    const previousRevenue = previousPeriod.reduce((sum: number, day: any) => sum + parseFloat(day.revenue || "0"), 0)
    const previousOrders = previousPeriod.reduce((sum: number, day: any) => sum + (day.orders_count || 0), 0)
    
    // Calculate growth percentages
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0
    const ordersChange = previousOrders > 0
      ? ((ordersRes.count || 0) - previousOrders) / previousOrders * 100
      : 0

    // Calculate session metrics
    const sessions = sessionsRes.data || []
    const totalSessions = sessionsRes.count || 0
    const avgSessionDuration = sessions.length > 0
      ? sessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0) / sessions.length
      : 0
    const bounceRate = sessions.length > 0
      ? (sessions.filter((s: any) => s.is_bounce).length / sessions.length) * 100
      : 0
    const totalPageViews = sessions.reduce((sum: number, s: any) => sum + (s.page_views || 0), 0)

    // Calculate cart metrics
    const carts = cartAnalyticsRes.data || []
    const abandonedCarts = carts.filter((c: any) => c.status === 'ABANDONED').length
    const completedCarts = carts.filter((c: any) => c.status === 'COMPLETED').length
    const cartAbandonmentRate = carts.length > 0
      ? (abandonedCarts / carts.length) * 100
      : 0
    const cartValue = carts.filter((c: any) => c.status === 'COMPLETED')
      .reduce((sum: number, c: any) => sum + parseFloat(c.total || "0"), 0)

    // Calculate product metrics
    const productAnalytics = productAnalyticsRes.data || []
    const totalProductViews = productAnalytics.reduce((sum: number, p: any) => sum + (p.views || 0), 0)
    const totalProductPurchases = productAnalytics.reduce((sum: number, p: any) => sum + (p.purchases || 0), 0)
    const productRevenue = productAnalytics.reduce((sum: number, p: any) => sum + parseFloat(p.revenue || "0"), 0)

    // Get today's summary if available
    const todayStats = todaySummary.data

    // Calculate conversion rate
    const conversionRate = totalSessions > 0
      ? ((ordersRes.count || 0) / totalSessions) * 100
      : 0

    // Calculate average order value
    const averageOrderValue = (ordersRes.count || 0) > 0
      ? totalRevenue / (ordersRes.count || 0)
      : 0

    const stats = {
      // Basic metrics
      totalOrders: ordersRes.count || 0,
      pendingOrders,
      totalProducts: productsRes.count || 0,
      totalCustomers: profilesRes.count || 0,
      totalRevenue,
      paidRevenue,
      averageOrderValue,
      
      // Growth metrics
      revenueChange: parseFloat(revenueChange.toFixed(2)),
      ordersChange: parseFloat(ordersChange.toFixed(2)),
      productsChange: 0, // Would need historical product data
      customersChange: 0, // Would need historical customer data
      
      // Session metrics
      totalSessions,
      avgSessionDuration: Math.round(avgSessionDuration),
      bounceRate: parseFloat(bounceRate.toFixed(2)),
      totalPageViews,
      
      // E-commerce metrics
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      cartAbandonmentRate: parseFloat(cartAbandonmentRate.toFixed(2)),
      abandonedCarts,
      completedCarts,
      cartValue,
      
      // Product metrics
      totalProductViews,
      totalProductPurchases,
      productRevenue,
      
      // Today's stats (if available)
      today: todayStats ? {
        sessions: todayStats.total_sessions || 0,
        revenue: parseFloat(todayStats.revenue || "0"),
        orders: todayStats.orders_count || 0,
        conversionRate: parseFloat(todayStats.conversion_rate || "0"),
      } : null,
    }

    return NextResponse.json({ 
      success: true, 
      stats 
    })
  } catch (error: any) {
    console.error("[Admin Stats API] Failed:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch stats",
        details: error?.message 
      },
      { status: 500 }
    )
  }
}
