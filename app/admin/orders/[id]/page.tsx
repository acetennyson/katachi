"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { SuperAdminGuard } from "@/components/admin/superadmin-guard"
import { BreadcrumbNav } from "@/components/admin/breadcrumb-nav"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Package, CreditCard, MapPin, User, Calendar, Edit, Truck } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LiveTrackingManager } from "@/components/admin/live-tracking-manager"

export default function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [orderId, setOrderId] = useState<string>("")
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")
  const [estimatedDelivery, setEstimatedDelivery] = useState("")

  useEffect(() => {
    params.then(p => setOrderId(p.id))
  }, [params])

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/signin?redirect=/admin/orders")
      } else if (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SUPPORT") {
        router.push("/profile")
      } else if (orderId) {
        fetchOrder()
      }
    }
  }, [user, isLoading, router, orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      const data = await response.json()
      
      if (data.success && data.order) {
        setOrder(data.order)
        // Load tracking info if available
        setTrackingNumber(data.order.tracking_number || "")
        setCarrier(data.order.carrier || "")
        setEstimatedDelivery(data.order.estimated_delivery ? 
          new Date(data.order.estimated_delivery).toISOString().slice(0, 16) : "")
      } else {
        toast.error("Order not found")
        router.push("/admin/orders")
      }
    } catch (error) {
      console.error("Failed to fetch order:", error)
      toast.error("Failed to load order")
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Order status updated!")
        setOrder({ ...order, status: newStatus })
      } else {
        toast.error(data.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Failed to update order:", error)
      toast.error("Failed to update order")
    } finally {
      setUpdating(false)
    }
  }

  const updatePaymentStatus = async (newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Payment status updated!")
        setOrder({ ...order, payment_status: newStatus })
      } else {
        toast.error(data.error || "Failed to update payment status")
      }
    } catch (error) {
      console.error("Failed to update payment:", error)
      toast.error("Failed to update payment")
    } finally {
      setUpdating(false)
    }
  }

  const updateTrackingInfo = async () => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          tracking_number: trackingNumber || null,
          carrier: carrier || null,
          estimated_delivery: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Tracking information updated!", {
          description: "Customers can now track this order using the tracking page."
        })
        setOrder({ 
          ...order, 
          tracking_number: trackingNumber,
          carrier: carrier,
          estimated_delivery: estimatedDelivery
        })
      } else {
        toast.error(data.error || "Failed to update tracking")
      }
    } catch (error) {
      console.error("Failed to update tracking:", error)
      toast.error("Failed to update tracking information")
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PAID: "bg-green-100 text-green-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-emerald-100 text-emerald-800",
      CANCELLED: "bg-red-100 text-red-800",
      UNPAID: "bg-gray-100 text-gray-800",
      AUTHORIZED: "bg-blue-100 text-blue-800",
      FAILED: "bg-red-100 text-red-800",
      REFUNDED: "bg-orange-100 text-orange-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (isLoading || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
      </main>
    )
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SUPPORT")) {
    return null
  }

  if (!order) {
    return null
  }

  const shippingAddress = typeof order.shipping_address === 'string' 
    ? JSON.parse(order.shipping_address) 
    : order.shipping_address || {}

  return (
    <SuperAdminGuard>
    <AdminLayout>
      <div className="container-custom max-w-6xl">
          <BreadcrumbNav items={[
            { label: "Orders", href: "/admin/orders" },
            { label: order.order_number }
          ]} />

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Order {order.order_number}</h1>
                <p className="text-neutral-600 mt-1">
                  Placed on {new Date(order.created_at).toLocaleDateString("en-US", { 
                    month: "long", 
                    day: "numeric", 
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(order.status)} className="text-sm px-3 py-1">
                  {order.status}
                </Badge>
                <Badge className={getStatusColor(order.payment_status)} className="text-sm px-3 py-1">
                  {order.payment_status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Status Management */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Edit className="h-5 w-5 text-neutral-600" />
                <h2 className="text-lg font-bold text-neutral-900">Order Status</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-2">Order Status</label>
                  <Select 
                    value={order.status} 
                    onValueChange={updateOrderStatus}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="SHIPPED">Shipped</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 block mb-2">Payment Status</label>
                  <Select 
                    value={order.payment_status} 
                    onValueChange={updatePaymentStatus}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                      <SelectItem value="AUTHORIZED">Authorized</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Customer Info */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-neutral-600" />
                <h2 className="text-lg font-bold text-neutral-900">Customer</h2>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-medium">{shippingAddress.name || 'N/A'}</p>
                <p className="text-neutral-600">{shippingAddress.email || 'N/A'}</p>
                <p className="text-neutral-600">{shippingAddress.phone || 'N/A'}</p>
              </div>
            </Card>

            {/* Shipping Address */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-neutral-600" />
                <h2 className="text-lg font-bold text-neutral-900">Shipping Address</h2>
              </div>
              <div className="space-y-1 text-sm text-neutral-600">
                <p>{shippingAddress.addressLine1 || 'N/A'}</p>
                {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
                <p>{shippingAddress.city || ''}, {shippingAddress.state || ''} {shippingAddress.postalCode || ''}</p>
                <p>{shippingAddress.country || 'BE'}</p>
              </div>
            </Card>
          </div>

          {/* Tracking Information */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-neutral-600" />
              <h2 className="text-lg font-bold text-neutral-900">Tracking Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  type="text"
                  placeholder="e.g., 1Z999AA10123456784"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  disabled={updating}
                />
              </div>
              <div>
                <Label htmlFor="carrier">Carrier</Label>
                <Select
                  value={carrier}
                  onValueChange={setCarrier}
                  disabled={updating}
                >
                  <SelectTrigger id="carrier">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USPS">USPS</SelectItem>
                    <SelectItem value="FedEx">FedEx</SelectItem>
                    <SelectItem value="UPS">UPS</SelectItem>
                    <SelectItem value="DHL">DHL</SelectItem>
                    <SelectItem value="bpost">bpost (Belgium)</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
                <Input
                  id="estimatedDelivery"
                  type="datetime-local"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  disabled={updating}
                />
              </div>
              <Button 
                onClick={updateTrackingInfo} 
                disabled={updating}
                className="w-full"
              >
                {updating ? "Updating..." : "Update Tracking Info"}
              </Button>
              {order.tracking_number && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Public Tracking Link:</strong>
                  </p>
                  <a 
                    href={`/track/${order.order_number}?email=${order.shipping_email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {typeof window !== 'undefined' && window.location.origin}/track/{order.order_number}
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Live Tracking Manager */}
          <LiveTrackingManager orderId={orderId} orderNumber={order.order_number} />

          {/* Order Items */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-neutral-600" />
              <h2 className="text-lg font-bold text-neutral-900">Order Items</h2>
            </div>
            <div className="space-y-4">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between pb-4 border-b border-neutral-200 last:border-0 last:pb-0">
                  <div className="flex-1">
                    {item.product_id ? (
                      <Link 
                        href={`/product/${item.product_id}`}
                        className="font-medium text-neutral-900 hover:text-blue-600 transition-colors"
                        target="_blank"
                      >
                        {item.product_name}
                      </Link>
                    ) : (
                      <p className="font-medium text-neutral-900">{item.product_name}</p>
                    )}
                    <p className="text-sm text-neutral-600 mt-1">
                      Quantity: {item.quantity} × €{parseFloat(item.unit_price).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">
                      €{(item.quantity * parseFloat(item.unit_price)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Order Summary */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-neutral-600" />
              <h2 className="text-lg font-bold text-neutral-900">Order Summary</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>€{parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Tax</span>
                  <span>€{parseFloat(order.tax).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Total</span>
                <span>€{parseFloat(order.total).toFixed(2)}</span>
              </div>
              {order.payment_id && (
                <div className="text-xs text-neutral-500 pt-2">
                  Payment ID: {order.payment_id}
                </div>
              )}
            </div>
          </Card>
        </div>
    </AdminLayout>
    </SuperAdminGuard>
  )
}
