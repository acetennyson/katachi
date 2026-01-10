"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { motion } from "framer-motion"
import { Package, ShoppingCart, Users, BarChart3, TrendingUp, Eye, Activity } from "lucide-react"
import Link from "next/link"
import { DashboardStats } from "./dashboard-stats"
import { RevenueChart } from "./revenue-chart"
import { RecentOrders } from "./recent-orders"
import { SalesChart } from "./sales-chart"

export default function AdminDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [realtimeData, setRealtimeData] = useState<any>(null)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not signed in, redirect to sign in
        router.push("/auth/signin?redirect=/admin")
      } else if (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SUPPORT") {
        // Signed in but not admin, redirect to profile
        router.push("/profile")
      } else {
        // Fetch analytics data
        fetchAnalytics()
        fetchRealtime()
        
        // Update realtime data every 30 seconds
        const interval = setInterval(fetchRealtime, 30000)
        return () => clearInterval(interval)
      }
    }
  }, [user, isLoading, router])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics/overview?days=7")
      const result = await response.json()
      if (result.success) {
        setAnalyticsData(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    }
  }

  const fetchRealtime = async () => {
    try {
      const response = await fetch("/api/admin/analytics/realtime")
      const result = await response.json()
      if (result.success) {
        setRealtimeData(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch realtime data:", error)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </main>
    )
  }

  // Don't render admin content if not authorized
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SUPPORT")) {
    return null
  }

  return (
    <AdminLayout>
      <div className="container-custom max-w-7xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
            <p className="text-neutral-600 mt-1">Welcome back! Here's what's happening with your store.</p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <DashboardStats />
          </div>

          {/* Analytics Overview */}
          {analyticsData && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-900">Analytics Overview (Last 7 Days)</h2>
                <Link href="/admin/analytics">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    View Full Analytics
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Real-time Visitors */}
                {realtimeData && (
                  <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium opacity-90">Live Visitors</div>
                      <Activity className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="text-3xl font-bold">{realtimeData.activeSessions || 0}</div>
                    <div className="text-xs opacity-80 mt-1">Active now</div>
                  </div>
                )}

                {/* Total Visitors */}
                <div className="p-6 bg-white border border-neutral-200 rounded-lg hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-neutral-600">Total Visitors</div>
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-neutral-900">
                    {(analyticsData.totals?.uniqueVisitors || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {(analyticsData.totals?.totalSessions || 0).toLocaleString()} sessions
                  </div>
                </div>

                {/* Page Views */}
                <div className="p-6 bg-white border border-neutral-200 rounded-lg hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-neutral-600">Page Views</div>
                    <Eye className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-neutral-900">
                    {(analyticsData.totals?.pageViews || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {analyticsData.totals?.pagesPerSession ? analyticsData.totals.pagesPerSession.toFixed(1) : '0'} per session
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="p-6 bg-white border border-neutral-200 rounded-lg hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-neutral-600">Conversion Rate</div>
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="text-3xl font-bold text-neutral-900">
                    {(analyticsData.totals?.conversionRate || 0).toFixed(2)}%
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {analyticsData.totals?.ordersCount || 0} orders
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <RevenueChart />
            <RecentOrders />
          </div>

          {/* Sales Chart */}
          <div className="mb-8">
            <SalesChart />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Link href="/admin/analytics">
              <motion.div
                className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all cursor-pointer"
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">Analytics</h3>
                </div>
                <p className="text-sm opacity-90">View detailed insights</p>
              </motion.div>
            </Link>

            <Link href="/admin/products">
              <motion.div
                className="p-6 bg-white border border-neutral-200 rounded-lg hover:shadow-lg transition-all cursor-pointer"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">Products</h3>
                </div>
                <p className="text-sm text-neutral-600">Manage your product catalog</p>
              </motion.div>
            </Link>

            <Link href="/admin/orders">
              <motion.div
                className="p-6 bg-white border border-neutral-200 rounded-lg hover:shadow-lg transition-all cursor-pointer"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">Orders</h3>
                </div>
                <p className="text-sm text-neutral-600">View and manage orders</p>
              </motion.div>
            </Link>

            <Link href="/admin/messaging">
              <motion.div
                className="p-6 bg-white border border-neutral-200 rounded-lg hover:shadow-lg transition-all cursor-pointer"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">Support</h3>
                </div>
                <p className="text-sm text-neutral-600">Customer messages</p>
              </motion.div>
            </Link>
          </div>
        </div>
    </AdminLayout>
  )
}
