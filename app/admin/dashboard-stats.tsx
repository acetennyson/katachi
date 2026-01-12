"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from "lucide-react"

interface StatsData {
  totalRevenue: number
  revenueChange: number
  totalOrders: number
  ordersChange: number
  totalProducts: number
  productsChange: number
  totalCustomers: number
  customersChange: number
}

export function DashboardStats() {
  // Render a lightweight loading state initially
  // Both SUPERADMIN and ADMIN can see this now; data will be scoped by the API
  
  const [stats, setStats] = useState<StatsData>({
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    totalProducts: 0,
    productsChange: 0,
    totalCustomers: 0,
    customersChange: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch real data from APIs
      const [ordersRes, productsRes] = await Promise.all([
        fetch("/api/admin/orders", { cache: 'no-store' }),
        fetch("/api/admin/products", { cache: 'no-store' }),
      ])

      const ordersData = await ordersRes.json()
      const productsData = await productsRes.json()

      // Calculate stats
      const totalRevenue = ordersData.orders?.reduce((sum: number, order: any) => 
        sum + parseFloat(order.total || 0), 0) || 0
      
      setStats({
        totalRevenue,
        revenueChange: 12.5,
        totalOrders: ordersData.orders?.length || 0,
        ordersChange: 8.2,
        totalProducts: productsData.products?.length || 0,
        productsChange: 5.4,
        totalCustomers: 0, // Will add later
        customersChange: 0,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: `€${stats.totalRevenue.toFixed(2)}`,
      change: stats.revenueChange,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      change: stats.ordersChange,
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Products",
      value: stats.totalProducts,
      change: stats.productsChange,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Customers",
      value: stats.totalCustomers,
      change: stats.customersChange,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-neutral-100 rounded"></div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon
        const isPositive = stat.change >= 0
        return (
          <Card key={stat.title} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(stat.change)}%
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
              <p className="text-sm text-neutral-600 mt-1">{stat.title}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
