"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Package, Search } from "lucide-react"
import { toast } from "sonner"

export default function TrackOrderPage() {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState("")
  const [email, setEmail] = useState("")
  const [searching, setSearching] = useState(false)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderNumber.trim() || !email.trim()) {
      toast.error("Please enter both order number and email")
      return
    }

    setSearching(true)
    try {
      // Navigate to the tracking result page
      router.push(`/track/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`)
    } catch (error) {
      toast.error("Failed to search for order")
    } finally {
      setSearching(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 bg-gradient-to-b from-neutral-50 to-white py-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-900 rounded-full mb-4">
              <Package className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-neutral-900 mb-3">
              Track Your Order
            </h1>
            <p className="text-lg text-neutral-600">
              Enter your order number and email to see your delivery status
            </p>
          </div>

          {/* Tracking Form */}
          <Card className="p-8 shadow-lg">
            <form onSubmit={handleTrack} className="space-y-6">
              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-neutral-900 mb-2">
                  Order Number
                </label>
                <Input
                  id="orderNumber"
                  type="text"
                  placeholder="e.g., ORD-2024-001234"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="text-lg h-12"
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Found in your order confirmation email
                </p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-2">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-lg h-12"
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">
                  The email you used when placing the order
                </p>
              </div>

              <Button
                type="submit"
                disabled={searching}
                className="w-full h-12 text-lg"
              >
                {searching ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Track Order
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-600 mb-4">
              Need help? Contact our support team
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" asChild>
                <a href="mailto:support@katachi.example">Email Support</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/messages">Live Chat</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
