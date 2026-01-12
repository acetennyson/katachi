"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { SuperAdminGuard } from "@/components/admin/superadmin-guard"
import { BreadcrumbNav } from "@/components/admin/breadcrumb-nav"
import { Card } from "@/components/ui/card"
import { Activity, Mouse, ShoppingBag, Search, TrendingUp, Users, Clock } from "lucide-react"

interface BehaviorData {
  eventTypes: Record<string, number>
  totalEvents: number
  totalSessions: number
  avgSessionLength: number
  avgSessionDuration: number
  topJourneys: Array<{ pattern: string; count: number }>
  topClicks: Array<{ target: string; count: number }>
  productInteractions: {
    views: number
    clicks: number
    addToCarts: number
  }
  topSearches: Array<{ query: string; count: number }>
}

export default function BehaviorAnalyticsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<BehaviorData | null>(null)
  const [timeRange, setTimeRange] = useState(30)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics/behavior?days=${timeRange}`)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch behavior analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-neutral-600">Loading...</div>
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
            { label: "User Behavior", href: "/admin/analytics/behavior" },
          ]}
        />

        <div className="flex items-center justify-between mb-6 mt-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
              <Activity className="w-8 h-8" />
              User Behavior Analytics
            </h1>
            <p className="text-neutral-600 mt-1">How users interact with your store</p>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Total Events</div>
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {data.totalEvents.toLocaleString()}
                </div>
                <div className="text-xs text-neutral-500 mt-2">
                  {data.totalSessions} sessions
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Avg Session Length</div>
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {data.avgSessionLength}
                </div>
                <div className="text-xs text-neutral-500 mt-2">
                  events per session
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Avg Session Time</div>
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {formatDuration(data.avgSessionDuration)}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Event Types</div>
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {Object.keys(data.eventTypes).length}
                </div>
              </Card>
            </div>

            {/* Event Types Distribution */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Event Distribution</h2>
              <div className="space-y-3">
                {Object.entries(data.eventTypes)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const percentage = (count / data.totalEvents) * 100
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-medium text-neutral-900 capitalize w-32">
                            {type.replace(/_/g, " ")}
                          </span>
                          <div className="flex-1 h-8 bg-neutral-100 rounded-lg overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center px-3"
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 10 && (
                                <span className="text-white text-sm font-semibold">
                                  {count.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-neutral-900 w-16 text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    )
                  })}
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top User Journeys */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Top User Journeys
                </h2>
                <div className="space-y-3">
                  {data.topJourneys.map((journey, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-900">#{index + 1}</span>
                        <span className="text-sm text-blue-700">{journey.count} sessions</span>
                      </div>
                      <div className="text-sm text-neutral-900 font-mono bg-white p-2 rounded">
                        {journey.pattern}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top Clicks */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <Mouse className="w-5 h-5 text-purple-600" />
                  Most Clicked Elements
                </h2>
                <div className="space-y-2">
                  {data.topClicks.map((click, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <span className="text-neutral-900 font-medium">{click.target}</span>
                      <span className="text-purple-700 font-semibold">{click.count} clicks</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Product Interactions */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-green-600" />
                Product Interactions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-4xl font-bold text-green-900">
                    {data.productInteractions.views.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 mt-2">Product Views</div>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-4xl font-bold text-blue-900">
                    {data.productInteractions.clicks.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700 mt-2">Product Clicks</div>
                </div>
                <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-4xl font-bold text-purple-900">
                    {data.productInteractions.addToCarts.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-700 mt-2">Add to Cart</div>
                </div>
              </div>
            </Card>

            {/* Top Searches */}
            {data.topSearches.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-orange-600" />
                  Top Search Queries
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.topSearches.map((search, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="text-neutral-900 font-medium">"{search.query}"</span>
                      </div>
                      <span className="text-orange-700 font-semibold">{search.count}×</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
