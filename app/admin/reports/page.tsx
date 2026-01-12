"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { SuperAdminGuard } from "@/components/admin/superadmin-guard"
import { BreadcrumbNav } from "@/components/admin/breadcrumb-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarChart3, Download, TrendingUp, DollarSign, Package, Truck } from "lucide-react"
import settings from "@/lib/constants/settings"

interface ReportData {
  summary: {
    totalOrders: number
    totalRevenue: number
    totalTax: number
    totalShipping: number
    averageOrderValue: number
  }
  shippingMethodStats: Record<string, { count: number; revenue: number }>
  statusStats: Record<string, number>
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
}

export default function ReportsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      let url = "/api/admin/reports?type=overview"
      if (startDate) url += `&startDate=${startDate}`
      if (endDate) url += `&endDate=${endDate}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setReportData(data)
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterApply = () => {
    fetchReports()
  }

  const handleExport = () => {
    if (!reportData) return
    
    const csvContent = [
      ["Report Summary"],
      ["Total Orders", reportData.summary.totalOrders],
      ["Total Revenue", reportData.summary.totalRevenue.toFixed(2)],
      ["Total Tax", reportData.summary.totalTax.toFixed(2)],
      ["Total Shipping", reportData.summary.totalShipping.toFixed(2)],
      ["Average Order Value", reportData.summary.averageOrderValue.toFixed(2)],
      [],
      ["Top Products"],
      ["Product Name", "Quantity Sold", "Revenue"],
      ...reportData.topProducts.map(p => [p.name, p.quantity, p.revenue.toFixed(2)]),
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
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
            { label: "Reports", href: "/admin/reports" },
          ]}
        />

        <div className="flex items-center justify-between mb-6 mt-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
              <BarChart3 className="w-8 h-8" />
              Sales Reports
            </h1>
            <p className="text-neutral-600 mt-1">Comprehensive analytics and insights</p>
          </div>
          
          <Button onClick={handleExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Date Filters */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">Filter by Date</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilterApply} className="w-full">
                Apply Filter
              </Button>
            </div>
          </div>
        </Card>

        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Total Revenue</div>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {settings.display.currencySymbol}{reportData.summary.totalRevenue.toFixed(2)}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {reportData.summary.totalOrders} orders
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Total Tax</div>
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {settings.display.currencySymbol}{reportData.summary.totalTax.toFixed(2)}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {((reportData.summary.totalTax / reportData.summary.totalRevenue) * 100).toFixed(1)}% of revenue
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Total Shipping</div>
                  <Truck className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {settings.display.currencySymbol}{reportData.summary.totalShipping.toFixed(2)}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Shipping revenue
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-neutral-600">Avg Order Value</div>
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-neutral-900">
                  {settings.display.currencySymbol}{reportData.summary.averageOrderValue.toFixed(2)}
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  Per order
                </div>
              </Card>
            </div>

            {/* Shipping Methods Stats */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Shipping Method Performance</h2>
              <div className="space-y-3">
                {Object.entries(reportData.shippingMethodStats).map(([method, stats]) => (
                  <div key={method} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-neutral-900">{method}</div>
                      <div className="text-sm text-neutral-600">{stats.count} orders</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-neutral-900">
                        {settings.display.currencySymbol}{stats.revenue.toFixed(2)}
                      </div>
                      <div className="text-xs text-neutral-500">Revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Products */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Top 10 Products by Revenue</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-semibold text-neutral-900">Product</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">Quantity</th>
                      <th className="text-right py-3 px-4 font-semibold text-neutral-900">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.topProducts.map((product, index) => (
                      <tr key={index} className="border-b border-neutral-100">
                        <td className="py-3 px-4 text-neutral-900">{product.name}</td>
                        <td className="py-3 px-4 text-right text-neutral-600">{product.quantity}</td>
                        <td className="py-3 px-4 text-right font-semibold text-neutral-900">
                          {settings.display.currencySymbol}{product.revenue.toFixed(2)}
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
