"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { 
  Package, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Truck,
  Home,
  AlertCircle,
  ChevronLeft
} from "lucide-react"

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface TrackingInfo {
  id: string
  order_number: string
  status: string
  payment_status: string
  created_at: string
  updated_at?: string
  total: number
  order_items: OrderItem[]
  shipping_name: string
  shipping_address_line1: string
  shipping_address_line2?: string
  shipping_city: string
  shipping_state: string
  shipping_postal_code: string
  shipping_country: string
  tracking_number?: string
  carrier?: string
  estimated_delivery?: string
}

const statusSteps = [
  { key: "PENDING", label: "Order Placed", icon: Package },
  { key: "PROCESSING", label: "Processing", icon: Clock },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: Home },
]

export default function TrackOrderResultPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const orderNumber = params.orderNumber as string

  const [loading, setLoading] = useState(true)
  const [tracking, setTracking] = useState<TrackingInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(`/auth/signin?redirect=/track/${orderNumber}`)
      } else {
        fetchTracking()
      }
    }
  }, [user, isLoading, orderNumber])

  const fetchTracking = async () => {
    if (!user) return

    try {
      // First verify access
      const accessRes = await fetch(`/api/orders/verify-access?orderNumber=${encodeURIComponent(orderNumber)}`)
      const accessData = await accessRes.json()

      if (!accessData.success || !accessData.canAccess) {
        setError(accessData.error || "You don't have access to this order")
        setLoading(false)
        return
      }

      // Then fetch tracking info
      const res = await fetch(`/api/orders/${accessData.orderId}`)
      const data = await res.json()

      if (res.ok && data.success) {
        setTracking(data.order)
        setError(null)
      } else {
        setError(data.error || "Order not found")
        setTracking(null)
      }
    } catch (err) {
      setError("Failed to load tracking information")
      setTracking(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIndex = (status: string) => {
    const index = statusSteps.findIndex((s) => s.key === status)
    return index >= 0 ? index : 0
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 bg-gradient-to-b from-neutral-50 to-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/track">
            <Button variant="ghost" className="mb-6">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Track Another Order
            </Button>
          </Link>

          {loading ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center">
                <Spinner className="w-12 h-12 mb-4" />
                <p className="text-neutral-600">Loading tracking information...</p>
              </div>
            </Card>
          ) : error ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Order Not Found</h2>
                <p className="text-neutral-600 mb-6">{error}</p>
                <p className="text-sm text-neutral-500 mb-6">
                  Please check your order number and email address and try again.
                </p>
                <Link href="/track">
                  <Button>Try Again</Button>
                </Link>
              </div>
            </Card>
          ) : tracking ? (
            <div className="space-y-6">
              {/* Header */}
              <Card className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-neutral-900 mb-1">
                      Order {tracking.order_number}
                    </h1>
                    <p className="text-neutral-600">
                      Placed on {formatDate(tracking.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full">
                      <span className={`w-2 h-2 rounded-full ${
                        tracking.status === "DELIVERED" ? "bg-green-500" :
                        tracking.status === "SHIPPED" ? "bg-blue-500" :
                        tracking.status === "PROCESSING" ? "bg-yellow-500" :
                        "bg-neutral-500"
                      }`} />
                      <span className="font-semibold text-neutral-900">
                        {tracking.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tracking Timeline */}
              <Card className="p-8">
                <h2 className="text-xl font-bold text-neutral-900 mb-8">Delivery Progress</h2>
                
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-neutral-200" />
                  <div 
                    className="absolute left-6 top-6 w-0.5 bg-neutral-900 transition-all duration-500"
                    style={{ 
                      height: `${(getStatusIndex(tracking.status) / (statusSteps.length - 1)) * 100}%` 
                    }}
                  />

                  {/* Status Steps */}
                  <div className="space-y-8 relative">
                    {statusSteps.map((step, index) => {
                      const isComplete = getStatusIndex(tracking.status) >= index
                      const isCurrent = getStatusIndex(tracking.status) === index
                      const Icon = step.icon

                      return (
                        <div key={step.key} className="flex items-start gap-4">
                          <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 transition-all ${
                            isComplete 
                              ? "bg-neutral-900 border-neutral-900" 
                              : "bg-white border-neutral-200"
                          }`}>
                            <Icon className={`w-6 h-6 ${
                              isComplete ? "text-white" : "text-neutral-400"
                            }`} />
                          </div>
                          
                          <div className="flex-1 pt-2">
                            <h3 className={`font-semibold ${
                              isComplete ? "text-neutral-900" : "text-neutral-500"
                            }`}>
                              {step.label}
                            </h3>
                            {isCurrent && (
                              <p className="text-sm text-neutral-600 mt-1">
                                {tracking.updated_at ? `Updated ${formatDate(tracking.updated_at)}` : "In progress"}
                              </p>
                            )}
                            {step.key === "DELIVERED" && tracking.status === "DELIVERED" && (
                              <p className="text-sm text-green-600 mt-1 font-medium">
                                ✓ Package delivered
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Tracking Number */}
                {tracking.tracking_number && (
                  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">Tracking Number</span>
                    </div>
                    <p className="text-lg font-mono text-blue-900">{tracking.tracking_number}</p>
                    {tracking.carrier && (
                      <p className="text-sm text-blue-700 mt-1">Carrier: {tracking.carrier}</p>
                    )}
                  </div>
                )}

                {/* Estimated Delivery */}
                {tracking.estimated_delivery && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">Estimated Delivery</span>
                    </div>
                    <p className="text-lg text-green-900 mt-1">
                      {formatDate(tracking.estimated_delivery)}
                    </p>
                  </div>
                )}
              </Card>

              {/* Shipping Address */}
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-neutral-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-2">Shipping Address</h3>
                    <div className="text-neutral-600">
                      <p className="font-medium text-neutral-900">{tracking.shipping_name}</p>
                      <p>{tracking.shipping_address_line1}</p>
                      {tracking.shipping_address_line2 && <p>{tracking.shipping_address_line2}</p>}
                      <p>
                        {tracking.shipping_city}, {tracking.shipping_state} {tracking.shipping_postal_code}
                      </p>
                      <p>{tracking.shipping_country}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Order Items */}
              <Card className="p-6">
                <h3 className="font-semibold text-neutral-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {tracking.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-3 border-b border-neutral-200 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">{item.product_name}</p>
                        <p className="text-sm text-neutral-600">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-neutral-900">
                        ${item.total_price.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-neutral-900">Total</span>
                    <span className="text-lg font-bold text-neutral-900">
                      ${tracking.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </div>

      <Footer />
    </main>
  )
}
