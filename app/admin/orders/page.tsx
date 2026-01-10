"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search, ExternalLink, Filter, Download } from "lucide-react"

export default function AdminOrders() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/signin?redirect=/admin/orders")
      } else if (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SUPPORT") {
        router.push("/profile")
      } else {
        fetchOrders()
      }
    }
  }, [user, isLoading, router])

  useEffect(() => {
    filterOrders()
  }, [searchQuery, statusFilter, orders])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders")
      const data = await response.json()
      setOrders(data.orders || [])
      setFilteredOrders(data.orders || [])
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredOrders(filtered)
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PAID: "bg-green-100 text-green-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-emerald-100 text-emerald-800",
      CANCELLED: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (isLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading orders...</p>
        </div>
      </main>
    )
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SUPPORT")) {
    return null
  }

  const statuses = ["ALL", "PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]

  return (
    <AdminLayout>
      <div className="container-custom max-w-7xl">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Orders Management</h1>
              <p className="text-neutral-600 mt-1">{filteredOrders.length} total orders</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search by order number or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2 flex-wrap">
                {statuses.map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          {/* Orders Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-neutral-900">Order Number</th>
                    <th className="text-left p-4 font-semibold text-neutral-900">Date</th>
                    <th className="text-left p-4 font-semibold text-neutral-900">Status</th>
                    <th className="text-left p-4 font-semibold text-neutral-900">Payment</th>
                    <th className="text-right p-4 font-semibold text-neutral-900">Total</th>
                    <th className="text-center p-4 font-semibold text-neutral-900">Items</th>
                    <th className="text-right p-4 font-semibold text-neutral-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold text-neutral-900">{order.order_number}</p>
                        <p className="text-xs text-neutral-500">{order.id.slice(0, 8)}...</p>
                      </td>
                      <td className="p-4 text-neutral-600">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(order.payment_status)}>{order.payment_status}</Badge>
                      </td>
                      <td className="p-4 text-right font-semibold text-neutral-900">
                        €{parseFloat(order.total).toFixed(2)}
                      </td>
                      <td className="p-4 text-center text-neutral-600">
                        {order.order_items?.length || 0}
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-neutral-600">No orders found</p>
                </div>
              )}
            </div>
          </Card>
        </div>
    </AdminLayout>
  )
}
