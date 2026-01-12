"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { SuperAdminGuard } from "@/components/admin/superadmin-guard"
import { BreadcrumbNav } from "@/components/admin/breadcrumb-nav"
import { Card } from "@/components/ui/card"
import { ShoppingCart, TrendingDown, TrendingUp, Clock, DollarSign } from "lucide-react"
import settings from "@/lib/constants/settings"

interface ConversionsData {
  funnel: Array<{ stage: string; count: number; percentage: number }>
  dropOffs: Array<{ from: string; to: string; dropOff: number; percentage: number }>
  productStats: Array<{
    productId: string
    productName: string
    views: number
    addToCarts: number
    purchases: number
    addToCartRate: number
    purchaseRate: number
  }>
  conversionRate: number
  avgTimeToConvert: number
  totalRevenue: number
  avgOrderValue: number
  ordersCount: number
}

export default function ConversionsAnalyticsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ConversionsData | null>(null)
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
      const response = await fetch(`/api/admin/analytics/conversions?days=${timeRange}`)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch conversion analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${mins}m`
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
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
            { label: "Conversions", href: "/admin/analytics/conversions" },
          ]}
        />

        <div className="flex items-center justify-between mb-6 mt-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
              <ShoppingCart className="w-8 h-8" />
              Conversion Analytics
            </h1>
            <p className="text-neutral-600 mt-1">Sales funnel and conversion insights</p>
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
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Conversion Rate</div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {data.conversionRate.toFixed(2)}%
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Avg Time to Convert</div>
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {formatDuration(data.avgTimeToConvert)}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Total Revenue</div>
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {settings.display.currencySymbol}{data.totalRevenue.toFixed(2)}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Avg Order Value</div>
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-neutral-900">
                  {settings.display.currencySymbol}{data.avgOrderValue.toFixed(2)}
                </div>
              </Card>
            </div>

            {/* Conversion Funnel */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-6">Conversion Funnel</h2>
              <div className="space-y-4">
                {data.funnel.map((stage, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? "bg-blue-600" :
                          index === 1 ? "bg-green-600" :
                          index === 2 ? "bg-yellow-600" :
                          index === 3 ? "bg-orange-600" : "bg-purple-600"
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900">{stage.stage}</div>
                          <div className="text-sm text-neutral-600">{stage.count.toLocaleString()} users</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-neutral-900">{stage.percentage.toFixed(1)}%</div>
                        <div className="text-sm text-neutral-500">of initial</div>
                      </div>
                    </div>
                    
                    {/* Funnel Visualization */}
                    <div className="relative h-16 flex items-center">
                      <div 
                        className={`h-full rounded-lg transition-all ${
                          index === 0 ? "bg-blue-500" :
                          index === 1 ? "bg-green-500" :
                          index === 2 ? "bg-yellow-500" :
                          index === 3 ? "bg-orange-500" : "bg-purple-500"
                        }`}
                        style={{ 
                          width: `${stage.percentage}%`,
                          opacity: 0.8
                        }}
                      />
                    </div>

                    {/* Drop-off indicator */}
                    {index < data.funnel.length - 1 && data.dropOffs[index] && (
                      <div className="flex items-center gap-2 mt-2 ml-14 text-sm text-red-600">
                        <TrendingDown className="w-4 h-4" />
                        <span className="font-semibold">
                          {data.dropOffs[index].dropOff} users ({data.dropOffs[index].percentage.toFixed(1)}%) 
                        </span>
                        <span className="text-neutral-600">
                          dropped off before {data.funnel[index + 1].stage}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Product Conversion Rates */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Product Conversion Rates</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-neutral-200">
                      <th className="text-left py-3 px-4 font-semibold text-neutral-900">Product</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">Views</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">Add to Cart</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">Purchases</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">Add Rate</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">Purchase Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.productStats.map((product, index) => (
                      <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-neutral-900">{product.productName}</div>
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-600">
                          {product.views.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-600">
                          {product.addToCarts.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-neutral-600">
                          {product.purchases.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-semibold ${
                            product.addToCartRate > 20 ? "text-green-600" :
                            product.addToCartRate > 10 ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {product.addToCartRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-semibold ${
                            product.purchaseRate > 30 ? "text-green-600" :
                            product.purchaseRate > 15 ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {product.purchaseRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
