"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { BreadcrumbNav } from "@/components/admin/breadcrumb-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, TrendingUp, LogIn, LogOut, Clock, Monitor, Smartphone, Tablet } from "lucide-react"

interface PageData {
  page: string
  views: number
  uniqueVisitors: number
  avgDuration: number
  devices: Record<string, number>
}

interface PageViewsData {
  topPages: PageData[]
  totalPageViews: number
  uniquePages: number
  entryPages: Array<{ page: string; count: number }>
  exitPages: Array<{ page: string; count: number }>
}

export default function PageViewsAnalyticsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PageViewsData | null>(null)
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
      const response = await fetch(`/api/admin/analytics/pageviews?days=${timeRange}`)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch page views:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case "mobile": return <Smartphone className="w-4 h-4" />
      case "tablet": return <Tablet className="w-4 h-4" />
      default: return <Monitor className="w-4 h-4" />
    }
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
            { label: "Page Views", href: "/admin/analytics/pageviews" },
          ]}
        />

        <div className="flex items-center justify-between mb-6 mt-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
              <Eye className="w-8 h-8" />
              Page Views Analytics
            </h1>
            <p className="text-neutral-600 mt-1">Detailed insights into page performance</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Total Page Views</div>
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {data.totalPageViews.toLocaleString()}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Unique Pages</div>
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {data.uniquePages}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Avg Views per Page</div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {(data.totalPageViews / data.uniquePages).toFixed(1)}
                </div>
              </Card>
            </div>

            {/* Top Pages Table */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Top Pages</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-neutral-200">
                      <th className="text-left py-3 px-4 font-semibold text-neutral-900">Page</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">Views</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">Unique</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">Avg Duration</th>
                      <th className="text-center py-3 px-4 font-semibold text-neutral-900">Devices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPages.map((page, index) => (
                      <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-neutral-900">{page.page}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-neutral-900">
                          {page.views.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-600">
                          {page.uniqueVisitors.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-600">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(page.avgDuration)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {Object.entries(page.devices).map(([device, count]) => (
                              <div key={device} className="flex items-center gap-1 text-xs text-neutral-600">
                                {getDeviceIcon(device)}
                                <span>{count}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Entry Pages */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-green-600" />
                  Top Entry Pages
                </h2>
                <div className="space-y-3">
                  {data.entryPages.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium text-neutral-900">{entry.page}</span>
                      </div>
                      <span className="text-neutral-600 font-semibold">{entry.count} entries</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Exit Pages */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-red-600" />
                  Top Exit Pages
                </h2>
                <div className="space-y-3">
                  {data.exitPages.map((exit, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium text-neutral-900">{exit.page}</span>
                      </div>
                      <span className="text-neutral-600 font-semibold">{exit.count} exits</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
