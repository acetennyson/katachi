"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LiveTrackingMap } from "@/components/live-tracking-map"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Lock } from "lucide-react"
import Link from "next/link"

export default function LiveTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const orderNumber = params.orderNumber as string

  const [orderId, setOrderId] = useState<string | null>(null)
  const [canAccess, setCanAccess] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Redirect to sign in
        router.push(`/auth/signin?redirect=/track/${orderNumber}/live`)
      } else {
        checkAccess()
      }
    }
  }, [user, isLoading, orderNumber])

  const checkAccess = async () => {
    if (!user) return

    setChecking(true)
    setError(null)

    try {
      // Check if user can access this order
      const res = await fetch(`/api/orders/verify-access?orderNumber=${encodeURIComponent(orderNumber)}`)
      const data = await res.json()

      if (data.success && data.canAccess) {
        setOrderId(data.orderId)
        setCanAccess(true)
      } else {
        setError(data.error || "You don't have access to this order")
        setCanAccess(false)
      }
    } catch (err) {
      setError("Failed to verify access")
      setCanAccess(false)
    } finally {
      setChecking(false)
    }
  }

  if (isLoading || checking) {
    return (
      <main className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 bg-gradient-to-b from-neutral-50 to-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link href="/track">
            <Button variant="ghost" className="mb-6">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Tracking
            </Button>
          </Link>

          {error ? (
            // Access Denied
            <Card className="max-w-md mx-auto p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <Lock className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                Access Denied
              </h1>
              <p className="text-neutral-600 mb-6">{error}</p>
              <Button onClick={() => router.push("/profile/orders")}>
                View Your Orders
              </Button>
            </Card>
          ) : canAccess && orderId ? (
            // Live Tracking Map
            <LiveTrackingMap 
              orderId={orderId} 
              email={user?.email || ""}
              orderNumber={orderNumber}
            />
          ) : null}
        </div>
      </div>

      <Footer />
    </main>
  )
}
