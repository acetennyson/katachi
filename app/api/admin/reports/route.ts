import { getSupabaseServiceRole } from "@/lib/supabase"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServiceRole()
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("type") || "overview"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let query = supabase
      .from("orders")
      .select(`
        id,
        order_number,
        status,
        payment_status,
        subtotal,
        tax,
        shipping_cost,
        total,
        shipping_method_id,
        shipping_method_name,
        created_at,
        order_items (
          product_name,
          quantity,
          unit_price,
          tax_percentage,
          shipping_price
        )
      `)

    // Apply date filters if provided
    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    const { data: orders, error } = await query.order("created_at", { ascending: false })

    if (error) throw error

    // Calculate summary statistics
    const summary = {
      totalOrders: orders?.length || 0,
      totalRevenue: orders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0,
      totalTax: orders?.reduce((sum, order) => sum + parseFloat(order.tax || 0), 0) || 0,
      totalShipping: orders?.reduce((sum, order) => sum + parseFloat(order.shipping_cost || 0), 0) || 0,
      averageOrderValue: 0,
    }

    if (summary.totalOrders > 0) {
      summary.averageOrderValue = summary.totalRevenue / summary.totalOrders
    }

    // Group by shipping method
    const shippingMethodStats: Record<string, { count: number; revenue: number }> = {}
    orders?.forEach(order => {
      const method = order.shipping_method_name || "Unknown"
      if (!shippingMethodStats[method]) {
        shippingMethodStats[method] = { count: 0, revenue: 0 }
      }
      shippingMethodStats[method].count++
      shippingMethodStats[method].revenue += parseFloat(order.shipping_cost || 0)
    })

    // Group by status
    const statusStats: Record<string, number> = {}
    orders?.forEach(order => {
      const status = order.status || "UNKNOWN"
      statusStats[status] = (statusStats[status] || 0) + 1
    })

    // Calculate daily revenue (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentOrders = orders?.filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    ) || []

    const dailyRevenue: Record<string, number> = {}
    recentOrders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split("T")[0]
      dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(order.total || 0)
    })

    // Top products by revenue
    const productRevenue: Record<string, { quantity: number; revenue: number }> = {}
    orders?.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const name = item.product_name
        if (!productRevenue[name]) {
          productRevenue[name] = { quantity: 0, revenue: 0 }
        }
        productRevenue[name].quantity += item.quantity
        productRevenue[name].revenue += item.quantity * parseFloat(item.unit_price || 0)
      })
    })

    const topProducts = Object.entries(productRevenue)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      summary,
      shippingMethodStats,
      statusStats,
      dailyRevenue,
      topProducts,
      orders: reportType === "detailed" ? orders : undefined,
    })
  } catch (error: any) {
    console.error("[Admin Reports API] Error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to generate reports", details: error?.message },
      { status: 500 }
    )
  }
}
