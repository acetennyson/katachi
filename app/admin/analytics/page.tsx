"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { BreadcrumbNav } from "@/components/admin/breadcrumb-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, TrendingUp, Users, Eye, ShoppingCart, DollarSign, 
  Monitor, Smartphone, Tablet, Globe, RefreshCw, Activity, Clock,
  Download, FileText, Mail
} from "lucide-react"
import settings from "@/lib/constants/settings"
import Link from "next/link"
import { exportToCSV, exportToPDF, formatDataForExport } from "@/lib/export-utils"

interface AnalyticsData {
  totals: {
    totalSessions: number
    uniqueVisitors: number
    pageViews: number
    ordersCount: number
    revenue: number
    avgSessionDuration: number
    avgBounceRate: number
    conversionRate: number
  }
  timeline: Array<{
    date: string
    total_sessions: number
    unique_visitors: number
    page_views: number
    revenue: number
  }>
  deviceBreakdown: Record<string, number>
  browserBreakdown: Record<string, number>
  countryBreakdown: Record<string, number>
  eventTypes: Record<string, number>
}

interface RealtimeData {
  activeSessions: number
  activePages: Record<string, number>
  totalEvents: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [realtime, setRealtime] = useState<RealtimeData | null>(null)
  const [timeRange, setTimeRange] = useState(30)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [previousData, setPreviousData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchRealtime, 10000) // Update every 10 seconds
    fetchRealtime()
    return () => clearInterval(interval)
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      let url = `/api/admin/analytics/overview?days=${timeRange}`
      if (startDate && endDate) {
        url = `/api/admin/analytics/overview?startDate=${startDate}&endDate=${endDate}`
      }
      
      const response = await fetch(url)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
        
        // If compare mode, fetch previous period
        if (compareMode && startDate && endDate) {
          const start = new Date(startDate)
          const end = new Date(endDate)
          const diff = end.getTime() - start.getTime()
          const prevStart = new Date(start.getTime() - diff)
          const prevEnd = new Date(start.getTime() - 1)
          
          const prevResponse = await fetch(
            `/api/admin/analytics/overview?startDate=${prevStart.toISOString().split("T")[0]}&endDate=${prevEnd.toISOString().split("T")[0]}`
          )
          const prevResult = await prevResponse.json()
          if (prevResult.success) {
            setPreviousData(prevResult.data)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!data) return
    const exportData = formatDataForExport(data, "overview")
    exportToCSV(exportData, "analytics-overview")
  }

  const handleExportPDF = () => {
    exportToPDF("analytics-dashboard", "analytics-report")
  }

  const handleScheduleReport = () => {
    // Navigate to email scheduling page
    router.push("/admin/analytics/schedule")
  }

  const fetchRealtime = async () => {
    try {
      const response = await fetch("/api/admin/analytics/realtime")
      const result = await response.json()
      if (result.success) {
        setRealtime(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch realtime data:", error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case "mobile": return <Smartphone className="w-4 h-4" />
      case "tablet": return <Tablet className="w-4 h-4" />
      default: return <Monitor className="w-4 h-4" />
    }
  }

  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return { percent: 0, isPositive: true }
    const change = ((current - previous) / previous) * 100
    return { percent: Math.abs(change), isPositive: change >= 0 }
  }

  const ComparisonBadge = ({ current, previous }: { current: number; previous: number }) => {
    const { percent, isPositive } = calculateChange(current, previous)
    if (!compareMode || !previousData || percent === 0) return null
    
    return (
      <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? "↑" : "↓"} {percent.toFixed(1)}%
        <span className="text-neutral-500">vs prev</span>
      </div>
    )
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-neutral-600">Loading analytics...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Analytics", href: "/admin/analytics" },
          ]}
        />

        <div className="flex items-center justify-between mb-6 mt-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Analytics Dashboard
            </h1>
            <p className="text-neutral-600 mt-1">Complete insights into your store performance</p>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => setShowDatePicker(!showDatePicker)} variant="outline">
              <Clock className="w-4 h-4 mr-2" />
              Custom Range
            </Button>
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <div className="relative">
              <Button onClick={() => setShowExportMenu(!showExportMenu)} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 z-50">
                  <button
                    onClick={() => { handleExportCSV(); setShowExportMenu(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-50 flex items-center gap-2 border-b border-neutral-100"
                  >
                    <FileText className="w-4 h-4 text-green-600" />
                    <span>Export to CSV</span>
                  </button>
                  <button
                    onClick={() => { handleExportPDF(); setShowExportMenu(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-50 flex items-center gap-2 border-b border-neutral-100"
                  >
                    <FileText className="w-4 h-4 text-red-600" />
                    <span>Export to PDF</span>
                  </button>
                  <button
                    onClick={() => { handleScheduleReport(); setShowExportMenu(false); }}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Schedule Email Report</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {showDatePicker && (
          <Card className="p-6 mb-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Custom Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={fetchAnalytics} className="flex-1">
                  Apply
                </Button>
                <label className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                  <input
                    type="checkbox"
                    checked={compareMode}
                    onChange={(e) => setCompareMode(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Compare</span>
                </label>
              </div>
            </div>
            {compareMode && (
              <p className="text-xs text-blue-600 mt-2">
                ✓ Comparison mode enabled - Previous period data will be shown
              </p>
            )}
          </Card>
        )}

        {/* Real-time Stats */}
        {realtime && (
          <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 mb-2">
                  <Activity className="w-4 h-4 animate-pulse" />
                  LIVE NOW
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  {realtime.activeSessions} <span className="text-lg font-normal">active sessions</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-700">Last 5 minutes</div>
                <div className="text-2xl font-bold text-blue-900">{realtime.totalEvents} events</div>
              </div>
            </div>
          </Card>
        )}

        <div id="analytics-dashboard">
        {data && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Total Visitors</div>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">{data.totals.uniqueVisitors.toLocaleString()}</div>
                {previousData && (
                  <ComparisonBadge 
                    current={data.totals.uniqueVisitors} 
                    previous={previousData.totals.uniqueVisitors} 
                  />
                )}
                <div className="text-xs text-neutral-500 mt-2">
                  {data.totals.totalSessions.toLocaleString()} sessions
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Page Views</div>
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">{data.totals.pageViews.toLocaleString()}</div>
                {previousData && (
                  <ComparisonBadge 
                    current={data.totals.pageViews} 
                    previous={previousData.totals.pageViews} 
                  />
                )}
                <div className="text-xs text-neutral-500 mt-2">
                  {(data.totals.pageViews / data.totals.totalSessions).toFixed(1)} per session
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Conversion Rate</div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">{data.totals.conversionRate.toFixed(2)}%</div>
                {previousData && (
                  <ComparisonBadge 
                    current={data.totals.conversionRate} 
                    previous={previousData.totals.conversionRate} 
                  />
                )}
                <div className="text-xs text-neutral-500 mt-2">
                  {data.totals.ordersCount} orders
                </div>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Revenue</div>
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {settings.display.currencySymbol}{data.totals.revenue.toFixed(2)}
                </div>
                {previousData && (
                  <ComparisonBadge 
                    current={data.totals.revenue} 
                    previous={previousData.totals.revenue} 
                  />
                )}
                <div className="text-xs text-neutral-500 mt-2">
                  {settings.display.currencySymbol}{(data.totals.revenue / data.totals.ordersCount || 0).toFixed(2)} avg order
                </div>
              </Card>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-neutral-600" />
                  <div className="font-semibold text-neutral-900">Avg Session Duration</div>
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {formatDuration(data.totals.avgSessionDuration)}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-neutral-600" />
                  <div className="font-semibold text-neutral-900">Bounce Rate</div>
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {data.totals.avgBounceRate.toFixed(1)}%
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart className="w-5 h-5 text-neutral-600" />
                  <div className="font-semibold text-neutral-900">Pages per Session</div>
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {(data.totals.pageViews / data.totals.totalSessions).toFixed(1)}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Device Breakdown */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Devices</h3>
                <div className="space-y-3">
                  {Object.entries(data.deviceBreakdown).map(([device, count]) => {
                    const total = Object.values(data.deviceBreakdown).reduce((a, b) => a + b, 0)
                    const percentage = (count / total) * 100
                    return (
                      <div key={device} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device)}
                          <span className="capitalize text-neutral-700">{device}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-neutral-900 w-12 text-right">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Top Countries */}
              <Card className="p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Top Countries
                </h3>
                <div className="space-y-3">
                  {Object.entries(data.countryBreakdown).length > 0 ? (
                    Object.entries(data.countryBreakdown).map(([country, count]) => (
                      <div key={country} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                        <span className="font-medium text-neutral-900">{country || "Unknown"}</span>
                        <span className="text-neutral-600">{count} visits</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      <Globe className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No country data available yet.</p>
                      <p className="text-xs mt-1">Country information will appear as visitors browse your site.</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/admin/analytics/pageviews">
                <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Eye className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900">Page Views</div>
                      <div className="text-sm text-neutral-600">Detailed page analytics</div>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/admin/analytics/behavior">
                <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-purple-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900">User Behavior</div>
                      <div className="text-sm text-neutral-600">How users interact</div>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/admin/analytics/conversions">
                <Card className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-green-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900">Conversions</div>
                      <div className="text-sm text-neutral-600">Sales funnel analysis</div>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </>
        )}
        </div>
      </div>
    </AdminLayout>
  )
}
