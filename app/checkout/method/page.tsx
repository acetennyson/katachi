"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CreditCard, Smartphone, Building2, ArrowLeft, Check } from "lucide-react"
import settings from "@/lib/constants/settings"

interface CheckoutData {
  shippingInfo?: {
    fullName: string
    email: string
    phone: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  paymentMethod?: string
}

const allPaymentMethods = [
  {
    id: "credit-card",
    name: "Credit Card",
    description: "Pay securely with your credit or debit card",
    icon: CreditCard,
    processingTime: "Instant",
    enabled: true, // Always available (Stripe or manual based on settings.payment.card)
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Fast and secure payment with PayPal",
    icon: Smartphone,
    processingTime: "Instant",
    enabled: settings.payment.paypal,
  },
  {
    id: "bank",
    name: "Bank Transfer",
    description: "Direct transfer from your bank account",
    icon: Building2,
    processingTime: "1-3 business days",
    enabled: settings.payment.bank_transfer,
  },
]

// Filter to only show enabled payment methods
const paymentMethods = allPaymentMethods.filter(method => method.enabled)

export default function PaymentMethodPage() {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({})

  useEffect(() => {
    // Load checkout data from localStorage
    const savedData = localStorage.getItem("checkoutData")
    if (savedData) {
      const data = JSON.parse(savedData) as CheckoutData
      setCheckoutData(data)
      setSelectedMethod(data.paymentMethod || "")
    }

    // If no shipping info, redirect back to checkout
    if (!savedData || !JSON.parse(savedData).shippingInfo) {
      router.push("/checkout")
    }
  }, [router])

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId)
  }

  const handleContinue = () => {
    if (!selectedMethod) return

    // Save selected payment method to localStorage
    const updatedData = {
      ...checkoutData,
      paymentMethod: selectedMethod,
    }
    localStorage.setItem("checkoutData", JSON.stringify(updatedData))

    // Navigate back to checkout review
    router.push("/checkout?step=review")
  }

  const handleBack = () => {
    router.push("/checkout")
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />
      <div className="pt-32 pb-20">
        <div className="container-custom max-w-4xl">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Checkout
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Payment Method</h2>
            <p className="text-neutral-600">Choose how you'd like to pay for your order</p>
          </div>

          {/* Payment Methods */}
          <div className="p-6 bg-neutral-50 rounded-lg mb-6">
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                const isSelected = selectedMethod === method.id

                return (
                  <label
                    key={method.id}
                    className="flex items-center p-4 border border-neutral-200 rounded-lg cursor-pointer hover:border-neutral-900 transition-all"
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={method.id}
                      checked={isSelected}
                      onChange={() => handleMethodSelect(method.id)}
                      className="w-4 h-4 text-neutral-900 focus:ring-neutral-900"
                    />
                    <div className="ml-4 flex items-center gap-3 flex-1">
                      <Icon className="w-5 h-5 text-neutral-600" />
                      <div className="flex-1">
                        <span className="text-neutral-900 font-medium">{method.name}</span>
                        <p className="text-xs text-neutral-500 mt-0.5">{method.description}</p>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Order Summary */}
          {checkoutData.shippingInfo && (
            <div className="p-6 bg-neutral-50 rounded-lg mb-6">
              <h3 className="font-semibold text-neutral-900 mb-4">Shipping To</h3>
              <p className="text-neutral-600">
                {checkoutData.shippingInfo.fullName}
                <br />
                {checkoutData.shippingInfo.address}
                <br />
                {checkoutData.shippingInfo.city}, {checkoutData.shippingInfo.postalCode}
                <br />
                {checkoutData.shippingInfo.country}
              </p>
            </div>
          )}

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!selectedMethod}
            className="w-full bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed py-6 text-lg"
          >
            Continue to Review Order
          </Button>
        </div>
      </div>
      <Footer />
    </main>
  )
}
