"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Package, MapPin, CreditCard, Calendar, Truck } from "lucide-react"

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method?: string
  payment_reference?: string
  subtotal: number
  tax: number
  shipping?: number
  total: number
  shipping_name: string
  shipping_email: string
  shipping_phone: string
  shipping_address_line1: string
  shipping_address_line2?: string
  shipping_city: string
  shipping_state: string
  shipping_postal_code: string
  shipping_country: string
  created_at: string
  updated_at?: string
  order_items: OrderItem[]
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/signin")
      return
    }

    if (user && params.id) {
      fetchOrderDetails()
    }
  }, [user, isLoading, router, params.id])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`, {
        headers: {
          "x-user-id": user?.id || "",
        },
      })

      const data = await response.json()

      if (data.success && data.order) {
        setOrder(data.order)
      } else {
        setError(data.error || "Order not found")
      }
      setLoading(false)
    } catch (err) {
      console.error("[Order Detail] Failed to fetch order:", err)
      setError("Failed to load order details")
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "delivered":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "processing":
      case "shipped":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "paid":
        return "text-green-600"
      case "pending":
        return "text-yellow-600"
      case "failed":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (isLoading || loading) {
    return (
      <div className="pt-32 pb-20">
        <div className="container-custom max-w-4xl">
          <p className="text-neutral-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="pt-32 pb-20">
        <div className="container-custom max-w-4xl">
          <Link href="/profile/orders" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8">
            <ChevronLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <div className="text-center py-12 bg-neutral-50 rounded-lg">
            <p className="text-neutral-600 mb-6">{error || "Order not found"}</p>
            <Link href="/profile/orders">
              <Button className="bg-neutral-900 text-white hover:bg-neutral-800">View All Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-32 pb-20">
      <div className="container-custom max-w-6xl">
        <Link href="/profile/orders" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 mb-2">{order.order_number}</h1>
              <p className="text-neutral-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Ordered on {new Date(order.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`px-4 py-2 ${getStatusColor(order.status)} text-sm rounded-full font-medium text-center`}>
                {order.status}
              </span>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <Reveal>
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Items
                </h2>
                <div className="space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start pb-4 border-b border-neutral-200 last:border-0 last:pb-0">
                      <div className="flex-1">
                        {item.product_id ? (
                          <Link 
                            href={`/product/${item.product_id}`}
                            className="font-medium text-neutral-900 hover:text-blue-600 hover:underline transition-colors"
                          >
                            {item.product_name}
                          </Link>
                        ) : (
                          <h3 className="font-medium text-neutral-900">{item.product_name}</h3>
                        )}
                        <p className="text-sm text-neutral-600 mt-1">Quantity: {item.quantity}</p>
                        <p className="text-sm text-neutral-600">€{item.unit_price.toFixed(2)} each</p>
                        {item.product_id && (
                          <Link 
                            href={`/product/${item.product_id}`}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                          >
                            View product details →
                          </Link>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-900">€{item.total_price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Shipping Address */}
            <Reveal>
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </h2>
                <div className="space-y-2 text-neutral-700">
                  <p className="font-medium">{order.shipping_name}</p>
                  <p>{order.shipping_address_line1}</p>
                  {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
                  <p>
                    {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
                  </p>
                  <p>{order.shipping_country}</p>
                  <div className="pt-4 mt-4 border-t border-neutral-200">
                    <p className="text-sm text-neutral-600">Email: {order.shipping_email}</p>
                    <p className="text-sm text-neutral-600">Phone: {order.shipping_phone}</p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Payment Information */}
            <Reveal>
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </h2>
                <div className="space-y-3">
                  {order.payment_method && (
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Payment Method:</span>
                      <span className="font-medium text-neutral-900 capitalize">{order.payment_method.replace('_', ' ')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Payment Status:</span>
                    <span className={`font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </div>
                  {order.payment_reference && (
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Reference:</span>
                      <span className="font-mono text-sm text-neutral-900">{order.payment_reference}</span>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Reveal>
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 sticky top-32">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-neutral-700">
                    <span>Subtotal:</span>
                    <span>€{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-700">
                    <span>Tax (19%):</span>
                    <span>€{order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-700">
                    <span>Shipping:</span>
                    <span>{order.shipping && order.shipping > 0 ? `€${order.shipping.toFixed(2)}` : "Free"}</span>
                  </div>
                  <div className="pt-4 border-t-2 border-neutral-300">
                    <div className="flex justify-between text-lg font-bold text-neutral-900">
                      <span>Total:</span>
                      <span>€{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-neutral-300">
                  <p className="text-sm text-neutral-600 mb-2">Need help with this order?</p>
                  <Link href="/messages">
                    <Button variant="outline" className="w-full">Contact Support</Button>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </div>
  )
}
