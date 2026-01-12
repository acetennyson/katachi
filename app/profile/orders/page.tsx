"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { ChevronLeft, MapPin, Navigation } from "lucide-react"

interface Order {
  id: string
  order_number: string
  created_at: string
  total: number
  status: string
  items: number
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/signin")
      return
    }

    if (user) {
      fetchOrders()
    }
  }, [user, isLoading, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders", {
        headers: {
          "x-user-id": user?.id || "",
        },
      })

      const data = await response.json()

      if (data.success && data.orders) {
        const formattedOrders = data.orders.map((order: any) => ({
          id: order.id,
          order_number: order.order_number,
          created_at: order.created_at,
          total: order.total,
          status: order.status,
          items: order.items_count || 0,
        }))
        setOrders(formattedOrders)
      }
      setLoading(false)
    } catch (err) {
      console.error("[v0] Failed to fetch orders:", err)
      setLoading(false)
    }
  }

  if (isLoading || !user) {
    return null
  }

  return (
    <div className="pt-32 pb-20">
      <div className="container-custom max-w-4xl">
        <Link href="/profile" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <Reveal>
          <h1 className="text-4xl font-bold mb-12 text-neutral-900">Order History</h1>
        </Reveal>

        {loading ? (
          <p className="text-neutral-600">Loading orders...</p>
        ) : orders.length === 0 ? (
          <Reveal>
            <div className="text-center py-12 bg-neutral-50 rounded-lg">
              <p className="text-neutral-600 mb-6">No orders yet</p>
              <Link href="/catalog">
                <Button className="bg-neutral-900 text-white hover:bg-neutral-800">Start Shopping</Button>
              </Link>
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <div className="space-y-4">
              {orders.map((order) => (
                <motion.div
                  key={order.id}
                  className="p-6 border border-neutral-200 rounded-lg hover:border-neutral-900 hover:shadow-md transition-all"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{order.order_number}</h3>
                      <p className="text-sm text-neutral-600">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      order.status === 'PAID' || order.status === 'DELIVERED' 
                        ? 'bg-green-100 text-green-800' 
                        : order.status === 'PENDING' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-neutral-600">{order.items} item(s)</span>
                    <span className="font-bold text-neutral-900">€{order.total.toFixed(2)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-neutral-200">
                    <Link href={`/profile/orders/${order.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/track/${order.order_number}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <MapPin className="w-4 h-4 mr-2" />
                        Track Order
                      </Button>
                    </Link>
                    {(order.status === 'SHIPPED' || order.status === 'PROCESSING') && (
                      <Link href={`/track/${order.order_number}/live`}>
                        <Button className="bg-neutral-900 text-white hover:bg-neutral-800">
                          <Navigation className="w-4 h-4 mr-2" />
                          Live Map
                        </Button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </div>
  )
}
