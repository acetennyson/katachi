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

    // Get all relevant events for conversion funnel
    const { data: events, error } = await supabase
      .from("analytics_events")
      .select("*")
      .gte("occurred_at", startDate.toISOString())
      .order("occurred_at", { ascending: true })

    if (error) throw error

    // Get orders for conversion rate
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, total, created_at")
      .gte("created_at", startDate.toISOString())

    if (ordersError) throw ordersError

    // Build conversion funnel
    const sessions = new Set(events?.map(e => e.session_id).filter(Boolean))
    const productViews = new Set(events?.filter(e => e.type === "product_view").map(e => e.session_id))
    const addToCarts = new Set(events?.filter(e => e.type === "add_to_cart").map(e => e.session_id))
    const checkoutStarts = new Set(events?.filter(e => e.type === "checkout_start" || e.type === "page_view" && e.payload?.page === "/checkout").map(e => e.session_id))
    const purchases = new Set(events?.filter(e => e.type === "purchase" || e.type === "order_complete").map(e => e.session_id))

    const funnel = [
      { stage: "Sessions", count: sessions.size, percentage: 100 },
      { stage: "Product Views", count: productViews.size, percentage: (productViews.size / sessions.size) * 100 },
      { stage: "Add to Cart", count: addToCarts.size, percentage: (addToCarts.size / sessions.size) * 100 },
      { stage: "Checkout Started", count: checkoutStarts.size, percentage: (checkoutStarts.size / sessions.size) * 100 },
      { stage: "Purchase Completed", count: purchases.size, percentage: (purchases.size / sessions.size) * 100 },
    ]

    // Drop-off analysis
    const dropOffs = [
      { 
        from: "Sessions", 
        to: "Product Views", 
        dropOff: sessions.size - productViews.size,
        percentage: ((sessions.size - productViews.size) / sessions.size) * 100
      },
      { 
        from: "Product Views", 
        to: "Add to Cart", 
        dropOff: productViews.size - addToCarts.size,
        percentage: ((productViews.size - addToCarts.size) / productViews.size) * 100
      },
      { 
        from: "Add to Cart", 
        to: "Checkout", 
        dropOff: addToCarts.size - checkoutStarts.size,
        percentage: ((addToCarts.size - checkoutStarts.size) / addToCarts.size) * 100
      },
      { 
        from: "Checkout", 
        to: "Purchase", 
        dropOff: checkoutStarts.size - purchases.size,
        percentage: ((checkoutStarts.size - purchases.size) / checkoutStarts.size) * 100
      },
    ]

    // Product conversion rates
    const productConversions: Record<string, {
      views: number
      addToCarts: number
      purchases: number
      revenue: number
    }> = {}

    events?.forEach(event => {
      const productId = event.payload?.productId || event.payload?.product_id
      if (productId && event.type === "product_view") {
        if (!productConversions[productId]) {
          productConversions[productId] = { views: 0, addToCarts: 0, purchases: 0, revenue: 0 }
        }
        productConversions[productId].views++
      }
      if (productId && event.type === "add_to_cart") {
        if (!productConversions[productId]) {
          productConversions[productId] = { views: 0, addToCarts: 0, purchases: 0, revenue: 0 }
        }
        productConversions[productId].addToCarts++
      }
    })

    // Get product names and calculate conversion rates
    const productStats = await Promise.all(
      Object.entries(productConversions).slice(0, 10).map(async ([productId, stats]) => {
        const { data: product } = await supabase
          .from("products")
          .select("name, price")
          .eq("id", productId)
          .single()

        return {
          productId,
          productName: product?.name || "Unknown Product",
          views: stats.views,
          addToCarts: stats.addToCarts,
          purchases: stats.purchases,
          addToCartRate: stats.views > 0 ? (stats.addToCarts / stats.views) * 100 : 0,
          purchaseRate: stats.addToCarts > 0 ? (stats.purchases / stats.addToCarts) * 100 : 0,
        }
      })
    )

    // Time to convert analysis
    const sessionsByUser: Record<string, any[]> = {}
    events?.forEach(event => {
      const userId = event.user_id || event.device_id
      if (userId) {
        if (!sessionsByUser[userId]) {
          sessionsByUser[userId] = []
        }
        sessionsByUser[userId].push(event)
      }
    })

    const conversionTimes: number[] = []
    Object.values(sessionsByUser).forEach(userEvents => {
      const firstView = userEvents.find(e => e.type === "product_view" || e.type === "page_view")
      const purchase = userEvents.find(e => e.type === "purchase" || e.type === "order_complete")
      
      if (firstView && purchase) {
        const timeToConvert = (new Date(purchase.occurred_at).getTime() - new Date(firstView.occurred_at).getTime()) / 1000
        conversionTimes.push(timeToConvert)
      }
    })

    const avgTimeToConvert = conversionTimes.length > 0
      ? conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length
      : 0

    // Revenue metrics
    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0
    const avgOrderValue = orders && orders.length > 0 ? totalRevenue / orders.length : 0

    return NextResponse.json({
      success: true,
      data: {
        funnel,
        dropOffs,
        productStats: productStats.sort((a, b) => b.views - a.views),
        conversionRate: sessions.size > 0 ? (purchases.size / sessions.size) * 100 : 0,
        avgTimeToConvert: Math.round(avgTimeToConvert),
        totalRevenue,
        avgOrderValue,
        ordersCount: orders?.length || 0,
      },
    })
  } catch (error: any) {
    console.error("[Conversions API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversion analytics", details: error?.message },
      { status: 500 }
    )
  }
}
