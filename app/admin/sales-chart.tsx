"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export function SalesChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSalesData()
  }, [])

  const fetchSalesData = async () => {
    try {
      const response = await fetch("/api/admin/orders", { cache: 'no-store' })
      const ordersData = await response.json()

      // Group orders by day and calculate revenue and count
      const salesByDate: { [key: string]: { revenue: number; orders: number } } = {}
      
      ordersData.orders?.forEach((order: any) => {
        const date = new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        if (!salesByDate[date]) {
          salesByDate[date] = { revenue: 0, orders: 0 }
        }
        salesByDate[date].revenue += parseFloat(order.total || 0)
        salesByDate[date].orders += 1
      })

      // Convert to chart data format
      const chartData = Object.entries(salesByDate).map(([date, data]) => ({
        date,
        revenue: parseFloat(data.revenue.toFixed(2)),
        orders: data.orders,
      }))

      setData(chartData.slice(-10)) // Last 10 days
    } catch (error) {
      console.error("Failed to fetch sales data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-neutral-900">Sales Overview</h3>
        <p className="text-sm text-neutral-600">Revenue and order count by day</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
          <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
          <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" fill="#10b981" name="Revenue (€)" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="orders" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
