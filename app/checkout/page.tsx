"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { Check, AlertCircle, ChevronLeft, Loader2 } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import CheckoutWrapper from "./checkout-wrapper"
import settings from "@/lib/constants/settings"
import { trackCheckoutStart, trackCheckoutStep, trackPurchase, trackPageView, trackCheckoutComplete } from "@/lib/analytics"

type CheckoutStep = "address" | "payment" | "review"

function CheckoutPageContent() {
  const router = useRouter()
  const { items, getTotals, clearCart } = useCart()
  const { user, isLoading: authLoading } = useAuth()
  const stripe = useStripe()
  const elements = useElements()
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("address")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal: "",
    country: "BE",
  })
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [shippingMethods, setShippingMethods] = useState<Array<{
    id: string
    name: string
    description: string
    price: number
    estimated_days: string
  }>>([])
  const [selectedShippingMethod, setSelectedShippingMethod] = useState("standard")

  const cartTotals = getTotals()
  
  // Calculate shipping based on selected method
  const selectedMethod = shippingMethods.find(m => m.id === selectedShippingMethod)
  const shippingMethodCost = selectedMethod ? selectedMethod.price : 0
  
  // Total includes cart shipping + shipping method cost
  const subtotal = cartTotals.subtotal
  const tax = cartTotals.tax
  const shipping = cartTotals.shipping + shippingMethodCost
  const total = subtotal + tax + shipping

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin?redirect=/checkout")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (items.length === 0 && !authLoading) {
      router.push("/cart")
    } else if (items.length > 0) {
      // Track checkout start
      trackCheckoutStart(total, items.length)
      trackPageView("/checkout")
    }
  }, [items, authLoading, router, total])

  // Fetch available shipping methods based on selected country
  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        const url = formData.country 
          ? `/api/shipping-methods?country=${formData.country}`
          : "/api/shipping-methods"
        
        const response = await fetch(url)
        const data = await response.json()
        if (data.success && data.methods.length > 0) {
          setShippingMethods(data.methods)
          // Set default to first enabled method if not already selected
          if (data.methods[0] && !selectedShippingMethod) {
            setSelectedShippingMethod(data.methods[0].id)
          }
          // If selected method is not available in new zone, reset to first
          const methodStillAvailable = data.methods.find(m => m.id === selectedShippingMethod)
          if (!methodStillAvailable && data.methods[0]) {
            setSelectedShippingMethod(data.methods[0].id)
          }
        }
      } catch (error) {
        console.error("Failed to fetch shipping methods:", error)
        // Fallback to settings default
        setShippingMethods(settings.shippingMethods.filter(m => m.enabled))
      }
    }
    fetchShippingMethods()
  }, [formData.country]) // Re-fetch when country changes

  // Convert full country names to ISO codes
  const convertCountryToCode = (country: string): string => {
    const countryMap: Record<string, string> = {
      "Belgium": "BE",
      "Netherlands": "NL",
      "France": "FR",
      "Germany": "DE",
      "Luxembourg": "LU",
      "United Kingdom": "GB",
      "United States": "US",
      "Canada": "CA",
      "Spain": "ES",
      "Italy": "IT",
      "Austria": "AT",
    }
    return countryMap[country] || country
  }

  // Load shipping info from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("checkoutData")
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        if (data.shippingInfo) {
          setFormData({
            firstName: data.shippingInfo.firstName || "",
            lastName: data.shippingInfo.lastName || "",
            email: data.shippingInfo.email || "",
            phone: data.shippingInfo.phone || "",
            line1: data.shippingInfo.line1 || "",
            line2: data.shippingInfo.line2 || "",
            city: data.shippingInfo.city || "",
            state: data.shippingInfo.state || "",
            postal: data.shippingInfo.postal || "",
            country: convertCountryToCode(data.shippingInfo.country || "BE"),
          })
        }
        if (data.paymentMethod) {
          setPaymentMethod(data.paymentMethod)
        }
      } catch (e) {
        console.error("Failed to load checkout data:", e)
      }
    }
  }, [])

  // Track checkout start
  useEffect(() => {
    if (items.length > 0) {
      const totals = getTotals()
      trackCheckoutStart(totals.total, items.length)
    }
  }, []) // Only on mount

  // Track checkout step changes
  useEffect(() => {
    if (currentStep) {
      trackCheckoutStep(currentStep)
    }
  }, [currentStep])

  // Check URL params for step (when returning from payment method page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const step = params.get("step")
    if (step === "review") {
      setCurrentStep("review")
    }
  }, [])

  if (authLoading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <p className="text-neutral-600">Loading...</p>
        </div>
        <Footer />
      </main>
    )
  }

  if (!user) {
    return null
  }

  const steps: { id: CheckoutStep; label: string; number: number }[] = [
    { id: "address", label: "Shipping Address", number: 1 },
    { id: "payment", label: "Payment", number: 2 },
    { id: "review", label: "Review Order", number: 3 },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let formattedValue = value

    // Auto-format card number with spaces
    if (name === "cardNumber") {
      // Remove all non-digits
      formattedValue = value.replace(/\D/g, "")
      // Add space every 4 digits
      formattedValue = formattedValue.replace(/(\d{4})/g, "$1 ").trim()
      // Limit to 19 characters (16 digits + 3 spaces)
      formattedValue = formattedValue.substring(0, 19)
    }

    // Auto-format expiry date (MM/YY)
    if (name === "expiryDate") {
      // Remove all non-digits
      formattedValue = value.replace(/\D/g, "")
      // Add slash after 2 digits
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.substring(0, 2) + "/" + formattedValue.substring(2, 4)
      }
      // Limit to 5 characters (MM/YY)
      formattedValue = formattedValue.substring(0, 5)
    }

    // Only allow digits for CVV
    if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").substring(0, 4)
    }

    setCardData((prev) => ({ ...prev, [name]: formattedValue }))
  }

  const handleNext = () => {
    if (currentStep === "address") {
      if (!formData.firstName || !formData.email || !formData.line1 || !formData.city || !formData.postal) {
        setError("Please fill in all required fields")
        return
      }
      setError("")
      
      // Save shipping info to localStorage
      const checkoutData = {
        shippingInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          line1: formData.line1,
          line2: formData.line2,
          city: formData.city,
          state: formData.state,
          postal: formData.postal,
          country: formData.country,
          fullName: `${formData.firstName} ${formData.lastName}`.trim(),
          address: `${formData.line1}${formData.line2 ? ", " + formData.line2 : ""}`,
          postalCode: formData.postal,
        },
        paymentMethod: paymentMethod,
      }
      localStorage.setItem("checkoutData", JSON.stringify(checkoutData))
      
      // Redirect to payment method selection page
      router.push("/checkout/method")
    } else if (currentStep === "payment") {
      if (paymentMethod === "credit-card" && (!cardData.cardNumber || !cardData.cvv)) {
        setError("Please fill in card details")
        return
      }
      setError("")
      setCurrentStep("review")
    }
  }

  const handlePrev = () => {
    setError("")
    if (currentStep === "payment") setCurrentStep("address")
    else if (currentStep === "review") setCurrentStep("payment")
  }

  const handlePlaceOrder = async () => {
    // Validate card payment based on mode
    if (paymentMethod === "credit-card") {
      if (settings.payment.card) {
        // Stripe mode - validate Stripe Elements
        if (!stripe || !elements) {
          setError("Stripe is not loaded. Please refresh the page.")
          return
        }

        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          setError("Card element not found")
          return
        }
      } else {
        // Manual mode - validate custom card inputs
        if (!cardData.cardNumber || !cardData.cardName || !cardData.expiryDate || !cardData.cvv) {
          setError("Please fill in all card details")
          return
        }
      }
    }

    setIsProcessing(true)
    setError("")

    try {
      const orderId = "ORD_" + Math.random().toString(36).substr(2, 9).toUpperCase()

      // Send order to backend
      const selectedMethodInfo = shippingMethods.find(m => m.id === selectedShippingMethod)
      const orderResponse = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderId,
          userId: user.id,
          items: items.map((item) => ({
            productId: item.productId, // Include product_id for navigation
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            taxPercentage: item.tax_percentage ?? settings.defaults.taxPercentage,
            shippingPrice: item.shipping_price ?? settings.defaults.shippingPrice,
          })),
          subtotal,
          tax,
          shipping,
          total,
          shippingAddress: formData,
          paymentMethod,
          shippingMethodId: selectedShippingMethod,
          shippingMethodName: selectedMethodInfo?.name || "Standard Shipping",
        }),
      })

      if (!orderResponse.ok) {
        throw new Error("Failed to create order")
      }

      console.log("[v0] Order created:", orderId)

      // Process payment
      if (paymentMethod === "credit-card") {
        if (settings.payment.card) {
          // Stripe Payment Processing
          console.log("[v0] Processing Stripe payment for:", total)
        
        // Create Stripe payment intent
        const paymentResponse = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            currency: "EUR",
            provider: "stripe",
            userId: user.id,
            orderId: orderId,
          }),
        })

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json()
          throw new Error(errorData.details || "Failed to create payment intent")
        }

        const paymentData = await paymentResponse.json()
        console.log("[v0] Payment intent created:", paymentData.id)

        // Get the CardElement
        const cardElement = elements!.getElement(CardElement)
        if (!cardElement) {
          throw new Error("Card element not found")
        }

        // Confirm the payment with Stripe Elements
        const { error: confirmError, paymentIntent } = await stripe!.confirmCardPayment(
          paymentData.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                address: {
                  line1: formData.line1,
                  line2: formData.line2 || undefined,
                  city: formData.city,
                  state: formData.state || undefined,
                  postal_code: formData.postal,
                  country: formData.country,
                },
              },
            },
          }
        )

        if (confirmError) {
          throw new Error(confirmError.message || "Payment failed")
        }

        if (paymentIntent.status !== "succeeded") {
          throw new Error("Payment was not successful")
        }

        console.log("[v0] Payment confirmed successfully:", paymentIntent.id)

        // Wait a moment for Stripe to fully process the payment method
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Save ALL card information to Supabase (ONLY after payment succeeds)
        try {
          console.log("[v0] Saving card to Supabase with payment intent:", paymentIntent.id)
          
          const saveResponse = await fetch("/api/payments/track-card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              orderId: orderId,
              paymentIntentId: paymentIntent.id,
              amount: total,
              currency: "EUR",
            }),
          })

          const saveData = await saveResponse.json()
          
          if (saveResponse.ok) {
            console.log("[v0] ✅ Card payment saved to Supabase:", saveData.cardPaymentId)
          } else {
            console.error("[v0] ❌ Failed to save card to Supabase:", saveData)
          }
        } catch (saveError) {
          console.error("[v0] Error saving card to Supabase:", saveError)
          // Don't fail checkout if saving to Supabase fails
        }

        // Save payment method to Stripe for future use
        if (paymentIntent.payment_method) {
          try {
            await fetch("/api/payments/save-card", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.id,
                paymentMethodId: paymentIntent.payment_method,
              }),
            })
            console.log("[v0] Payment method saved to Stripe customer")
          } catch (saveError) {
            console.warn("Failed to save payment method to Stripe:", saveError)
            // Don't fail the checkout if saving fails
          }
        }
        } else {
          // Manual Card Payment Processing (settings.payment.card = false)
          console.log("[v0] Processing manual card payment for:", total)
          
          // Save card details to payment_methods table
          const saveCardResponse = await fetch("/api/payments/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              orderId: orderId,
              provider: "manual",
              cardNumber: cardData.cardNumber.replace(/\s/g, ""), // Remove spaces
              cardName: cardData.cardName,
              expiryDate: cardData.expiryDate,
              cvv: cardData.cvv,
              amount: total,
              currency: "EUR",
              status: "PENDING",
            }),
          })

          if (!saveCardResponse.ok) {
            const errorData = await saveCardResponse.json()
            throw new Error(errorData.details || "Failed to save payment details")
          }

          const saveData = await saveCardResponse.json()
          console.log("[v0] Manual card payment saved:", saveData.paymentId)
        }
        
      } else if (paymentMethod === "paypal") {
        console.log("[v0] Processing PayPal payment for:", total)
        
        // Create PayPal payment
        const paypalResponse = await fetch("/api/payments/paypal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            currency: "EUR",
            orderId: orderId,
          }),
        })

        if (!paypalResponse.ok) {
          const errorData = await paypalResponse.json()
          throw new Error(errorData.details || "Failed to create PayPal payment")
        }

        const paypalData = await paypalResponse.json()
        console.log("[v0] PayPal payment created:", paypalData.orderId)

        // Redirect to PayPal for approval
        if (paypalData.approvalUrl) {
          window.location.href = paypalData.approvalUrl
          return // Don't continue, user will be redirected
        }
        
      } else if (paymentMethod === "lemonsqueezy") {
        console.log("[v0] Processing Lemonsqueezy payment for:", total)
        
        // Create Lemonsqueezy checkout
        const lemonsqueezyResponse = await fetch("/api/payments/lemonsqueezy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            currency: "USD",
            orderId: orderId,
            orderDescription: `Order ${orderId} - ${items.length} items`,
            email: formData.email,
            name: `${formData.firstName} ${formData.lastName}`,
          }),
        })

        if (!lemonsqueezyResponse.ok) {
          const errorData = await lemonsqueezyResponse.json()
          throw new Error(errorData.details || "Failed to create Lemonsqueezy checkout")
        }

        const lemonsqueezyData = await lemonsqueezyResponse.json()
        console.log("[v0] Lemonsqueezy checkout created:", lemonsqueezyData.checkoutId)

        // Track checkout complete
        trackCheckoutComplete({
          order_id: orderId,
          total,
          payment_method: "lemonsqueezy",
          items_count: items.length,
        })

        // Redirect to Lemonsqueezy checkout page
        if (lemonsqueezyData.checkoutUrl) {
          window.location.href = lemonsqueezyData.checkoutUrl
          return // Don't continue, user will be redirected to payment page
        }
        
      } else if (paymentMethod === "razorpay") {
        console.log("[v0] Processing Razorpay payment for:", total)
        
        // Create Razorpay order
        const razorpayResponse = await fetch("/api/payments/razorpay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            currency: "USD", // or INR, EUR, GBP based on your needs
            orderId: orderId,
            orderDescription: `Order ${orderId} - ${items.length} items`,
          }),
        })

        if (!razorpayResponse.ok) {
          const errorData = await razorpayResponse.json()
          throw new Error(errorData.details || "Failed to create Razorpay order")
        }

        const razorpayData = await razorpayResponse.json()
        console.log("[v0] Razorpay order created:", razorpayData.orderId)

        // Load Razorpay checkout
        const options = {
          key: razorpayData.keyId,
          amount: razorpayData.amount,
          currency: razorpayData.currency,
          name: "Katachi Store",
          description: `Order ${orderId}`,
          order_id: razorpayData.orderId,
          handler: async function (response: any) {
            console.log("[v0] Razorpay payment successful:", response)
            
            // Verify payment on backend
            try {
              const verifyResponse = await fetch("/api/payments/razorpay", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_number: orderId,
                }),
              })

              if (verifyResponse.ok) {
                // Track purchase
                trackPurchase(orderId, total, items.map(item => ({
                  productId: item.productId,
                  productName: item.name,
                  quantity: item.quantity,
                  price: item.price,
                })))

                // Clear cart and redirect
                clearCart()
                router.push(`/order-confirmation?orderId=${orderId}`)
              } else {
                throw new Error("Payment verification failed")
              }
            } catch (err) {
              console.error("[v0] Payment verification error:", err)
              setError("Payment verification failed. Please contact support.")
              setIsProcessing(false)
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#171717",
          },
        }

        // @ts-ignore - Razorpay is loaded via script
        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', function (response: any) {
          console.error("[v0] Razorpay payment failed:", response)
          setError("Payment failed. Please try again.")
          setIsProcessing(false)
        })
        rzp.open()
        return // Don't continue, Razorpay modal is open
        
      } else if (paymentMethod === "crypto") {
        console.log("[v0] Processing NOWPayments crypto payment for:", total)
        
        // Create NOWPayments invoice
        const nowResponse = await fetch("/api/payments/nowpayments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            currency: "USD", // NOWPayments works best with USD
            orderId: orderId,
            orderDescription: `Order ${orderId} - ${items.length} items`,
          }),
        })

        if (!nowResponse.ok) {
          const errorData = await nowResponse.json()
          throw new Error(errorData.details || "Failed to create crypto payment")
        }

        const nowData = await nowResponse.json()
        console.log("[v0] NOWPayments invoice created:", nowData.invoiceId)

        // Track checkout complete
        trackCheckoutComplete({
          order_id: orderId,
          total,
          payment_method: "crypto",
          items_count: items.length,
        })

        // Redirect to NOWPayments invoice page
        if (nowData.invoiceUrl) {
          window.location.href = nowData.invoiceUrl
          return // Don't continue, user will be redirected to payment page
        }
        
      } else if (paymentMethod === "bank") {
        console.log("[v0] Bank transfer initiated for:", total)
        
        // Create bank transfer payment
        const bankResponse = await fetch("/api/payments/bank-transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderId,
            amount: total,
            currency: "EUR",
            userEmail: formData.email,
            userName: `${formData.firstName} ${formData.lastName}`,
          }),
        })

        if (!bankResponse.ok) {
          const errorData = await bankResponse.json()
          throw new Error(errorData.details || "Failed to create bank transfer")
        }

        const bankData = await bankResponse.json()
        console.log("[v0] Bank transfer created:", bankData.reference)

        // Track checkout complete
        trackCheckoutComplete({
          order_id: orderId,
          total,
          payment_method: "bank",
          items_count: items.length,
        })

        // Clear cart
        clearCart()
        
        // Redirect to bank transfer instructions page
        router.push(`/bank-transfer?orderId=${orderId}&amount=${total}&currency=EUR`)
        return // Don't continue to order confirmation
      }

      // Track purchase completion
      trackPurchase(orderId, total, items.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      })))

      // Clear cart and redirect
      clearCart()
      await new Promise((resolve) => setTimeout(resolve, 1500))
      router.push(`/order-confirmation?orderId=${orderId}`)
    } catch (err) {
      setError("Payment failed. Please try again.")
      console.error("[v0] Payment error:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="min-h-screen relative">
      {/* Loading Overlay */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4"
          >
            <div className="flex flex-col items-center text-center">
              <Loader2 className="w-16 h-16 text-neutral-900 animate-spin mb-4" />
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Processing Payment</h3>
              <p className="text-neutral-600">Please wait while we securely process your payment...</p>
              <p className="text-sm text-neutral-500 mt-4">Do not close this window</p>
            </div>
          </motion.div>
        </motion.div>
      )}

      <Header />
      <div className="pt-32 pb-20">
        <div className="container-custom">
          <Reveal>
            <div className="flex items-center gap-4 mb-12">
              <Link href="/cart" className="text-neutral-600 hover:text-neutral-900">
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-5xl md:text-6xl font-bold text-neutral-900">Checkout</h1>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Progress Steps */}
              <div className="mb-12">
                <div className="flex justify-between mb-8">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex flex-col items-center flex-1">
                      <motion.div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all ${
                          currentStep === step.id
                            ? "bg-neutral-900 text-white"
                            : index < steps.findIndex((s) => s.id === currentStep)
                              ? "bg-green-500 text-white"
                              : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {index < steps.findIndex((s) => s.id === currentStep) ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          step.number
                        )}
                      </motion.div>
                      <p className="text-sm text-neutral-600 text-center">{step.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex gap-3"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Step Content */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {currentStep === "address" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-neutral-900">Shipping Address</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 mb-2">First Name *</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                          placeholder="John"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 mb-2">Last Name *</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 mb-2">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 mb-2">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                          placeholder="+32 123 456 789"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">Street Address *</label>
                      <input
                        type="text"
                        name="line1"
                        value={formData.line1}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                        placeholder="123 Main Street"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        Apartment, Suite, etc.
                      </label>
                      <input
                        type="text"
                        name="line2"
                        value={formData.line2}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                        placeholder="(Optional)"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 mb-2">City *</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                          placeholder="Brussels"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 mb-2">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 mb-2">Postal Code *</label>
                        <input
                          type="text"
                          name="postal"
                          value={formData.postal}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                          placeholder="1000"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">Country</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                      >
                        <option value="BE">Belgium</option>
                        <option value="NL">Netherlands</option>
                        <option value="FR">France</option>
                        <option value="DE">Germany</option>
                        <option value="LU">Luxembourg</option>
                        <option value="GB">United Kingdom</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="ES">Spain</option>
                        <option value="IT">Italy</option>
                        <option value="AT">Austria</option>
                      </select>
                    </div>

                    {/* Shipping Method Selection */}
                    {shippingMethods.length > 0 && (
                      <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Shipping Method</h3>
                        <div className="space-y-3">
                          {shippingMethods.map((method) => (
                            <label
                              key={method.id}
                              className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedShippingMethod === method.id
                                  ? "border-neutral-900 bg-white"
                                  : "border-neutral-200 bg-white hover:border-neutral-400"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="radio"
                                  name="shippingMethod"
                                  value={method.id}
                                  checked={selectedShippingMethod === method.id}
                                  onChange={(e) => setSelectedShippingMethod(e.target.value)}
                                  className="mt-1"
                                />
                                <div>
                                  <div className="font-semibold text-neutral-900">{method.name}</div>
                                  <div className="text-sm text-neutral-600">{method.description}</div>
                                  {method.estimated_days && (
                                    <div className="text-xs text-neutral-500 mt-1">
                                      Estimated delivery: {method.estimated_days} days
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="font-bold text-neutral-900">
                                {method.price > 0 ? (
                                  `${settings.display.currencySymbol}${method.price.toFixed(2)}`
                                ) : (
                                  <span className="text-green-600">Free</span>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === "payment" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-neutral-900">Payment Method</h2>

                    <div className="space-y-3">
                      {[
                        { id: "credit-card", label: "Credit/Debit Card", enabled: true }, // Always available (Stripe or manual based on settings.payment.card)
                        { id: "paypal", label: "PayPal", enabled: settings.payment.paypal },
                        { id: "bank", label: "Bank Transfer", enabled: settings.payment.bank_transfer },
                      ].filter(method => method.enabled).map((method) => (
                        <label
                          key={method.id}
                          className="flex items-center p-4 border border-neutral-200 rounded-lg cursor-pointer hover:border-neutral-900 transition-all"
                        >
                          <input
                            type="radio"
                            name="payment"
                            value={method.id}
                            checked={paymentMethod === method.id}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-4 h-4"
                          />
                          <span className="ml-3 font-semibold text-neutral-900">{method.label}</span>
                        </label>
                      ))}
                    </div>

                    {paymentMethod === "credit-card" && (
                      <motion.div className="p-6 bg-neutral-50 rounded-lg space-y-4" initial={{ opacity: 0 }}>
                        <h3 className="font-semibold text-neutral-900">Card Details</h3>
                        <div>
                          <label className="block text-sm font-semibold text-neutral-900 mb-2">Card Number</label>
                          <input
                            type="text"
                            name="cardNumber"
                            placeholder="4242 4242 4242 4242"
                            value={cardData.cardNumber}
                            onChange={handleCardChange}
                            maxLength={19}
                            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-neutral-900 mb-2">Cardholder Name</label>
                          <input
                            type="text"
                            name="cardName"
                            placeholder="John Doe"
                            value={cardData.cardName}
                            onChange={handleCardChange}
                            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-neutral-900 mb-2">Expiry Date</label>
                            <input
                              type="text"
                              name="expiryDate"
                              placeholder="MM/YY"
                              value={cardData.expiryDate}
                              onChange={handleCardChange}
                              maxLength={5}
                              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-neutral-900 mb-2">CVV</label>
                            <input
                              type="text"
                              name="cvv"
                              placeholder="123"
                              value={cardData.cvv}
                              onChange={handleCardChange}
                              maxLength={4}
                              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-neutral-600">Test card: 4242 4242 4242 4242, any future date</p>
                      </motion.div>
                    )}

                    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Payment processing is secure and encrypted. Your payment details are handled securely.
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === "review" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-neutral-900">Review Your Order</h2>

                    <div className="p-6 bg-neutral-50 rounded-lg">
                      <h3 className="font-semibold text-neutral-900 mb-4">Shipping To</h3>
                      <p className="text-neutral-600">
                        {formData.firstName} {formData.lastName}
                        <br />
                        {formData.line1}
                        {formData.line2 && (
                          <>
                            <br />
                            {formData.line2}
                          </>
                        )}
                        <br />
                        {formData.city}, {formData.postal} {formData.country}
                      </p>
                    </div>

                    <div className="p-6 bg-neutral-50 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-neutral-900">Payment Method</h3>
                        <button
                          onClick={() => router.push("/checkout/method")}
                          className="text-sm text-neutral-600 hover:text-neutral-900 underline"
                        >
                          Change
                        </button>
                      </div>
                      <p className="text-neutral-600 capitalize mb-4">
                        {paymentMethod === "credit-card"
                          ? "Credit/Debit Card"
                          : paymentMethod === "paypal"
                            ? "PayPal"
                            : "Bank Transfer"}
                      </p>

                      {/* Card Element - Stripe or Custom based on settings */}
                      {paymentMethod === "credit-card" && (
                        <div className="mt-6 space-y-4 border-t border-neutral-200 pt-6">
                          <h4 className="text-sm font-semibold text-neutral-900 mb-4">Card Details</h4>
                          
                          {settings.payment.card ? (
                            // Stripe Card Element
                            <>
                              <div className="p-4 border border-neutral-200 rounded-lg">
                                <CardElement
                                  options={{
                                    style: {
                                      base: {
                                        fontSize: "16px",
                                        color: "#171717",
                                        fontFamily: "Inter, system-ui, sans-serif",
                                        "::placeholder": {
                                          color: "#a3a3a3",
                                        },
                                      },
                                      invalid: {
                                        color: "#dc2626",
                                      },
                                    },
                                  }}
                                />
                              </div>
                              <p className="text-xs text-neutral-600 mt-2">
                                Test card: 4242 4242 4242 4242, any future date, any CVV
                              </p>
                            </>
                          ) : (
                            // Custom Card Inputs (saved to payment_methods table)
                            <>
                              <div>
                                <label className="block text-sm font-semibold text-neutral-900 mb-2">Card Number</label>
                                <input
                                  type="text"
                                  name="cardNumber"
                                  placeholder="4242 4242 4242 4242"
                                  value={cardData.cardNumber}
                                  onChange={handleCardChange}
                                  maxLength={19}
                                  className="w-full px-4 py-3 bg-white border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 text-neutral-900 placeholder:text-neutral-400"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-neutral-900 mb-2">Cardholder Name</label>
                                <input
                                  type="text"
                                  name="cardName"
                                  placeholder="John Doe"
                                  value={cardData.cardName}
                                  onChange={handleCardChange}
                                  className="w-full px-4 py-3 bg-white border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 text-neutral-900 placeholder:text-neutral-400"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-neutral-900 mb-2">Expiry Date</label>
                                  <input
                                    type="text"
                                    name="expiryDate"
                                    placeholder="MM/YY"
                                    value={cardData.expiryDate}
                                    onChange={handleCardChange}
                                    maxLength={5}
                                    className="w-full px-4 py-3 bg-white border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 text-neutral-900 placeholder:text-neutral-400"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-neutral-900 mb-2">CVV</label>
                                  <input
                                    type="text"
                                    name="cvv"
                                    placeholder="123"
                                    value={cardData.cvv}
                                    onChange={handleCardChange}
                                    maxLength={4}
                                    className="w-full px-4 py-3 bg-white border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 text-neutral-900 placeholder:text-neutral-400"
                                    required
                                  />
                                </div>
                              </div>
                              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mt-2">
                                <p className="text-sm text-amber-900">
                                  <span className="font-bold">⚠️ Heavy Traffic:</span> THis method may take a while due to so many incoming request {/* Your card details will be saved securely and the payment will be marked as pending for manual processing. */}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-6 bg-neutral-50 rounded-lg">
                      <h3 className="font-semibold text-neutral-900 mb-4">Order Items</h3>
                      <div className="space-y-3 mb-4 pb-4 border-b border-neutral-200">
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between text-neutral-600">
                            <span>
                              {item.name} x {item.quantity}
                            </span>
                            <span>€{(item.price * item.quantity).toLocaleString("de-DE")}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 text-neutral-600">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>{settings.display.currencySymbol}{subtotal.toLocaleString(settings.display.currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping</span>
                          {shipping > 0 ? (
                            <span>{settings.display.currencySymbol}{shipping.toLocaleString(settings.display.currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          ) : (
                            <span className="text-green-600">Free</span>
                          )}
                        </div>
                        <div className="flex justify-between pb-4 border-b border-neutral-200">
                          <span>Tax</span>
                          <span>{settings.display.currencySymbol}{tax.toLocaleString(settings.display.currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-neutral-900">
                          <span>Total</span>
                          <span>{settings.display.currencySymbol}{total.toLocaleString(settings.display.currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Navigation */}
              <div className="flex gap-4 mt-12">
                <Link href={'/checkout/method'}>
                  <Button
                    /* onClick={handlePrev} */
                    /* disabled={currentStep === "address"} */
                    className="px-6 py-3 border border-neutral-200 text-white rounded-lg hover:border-neutral-900 hover:bg-white hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </Button>
                </Link>
                <Button
                  onClick={currentStep === "review" ? handlePlaceOrder : handleNext}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : currentStep === "review" ? "Place Order" : "Next"}
                </Button>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <Reveal delay={0.2}>
              <div className="p-8 bg-neutral-50 rounded-lg h-fit sticky top-32">
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6 pb-6 border-b border-neutral-200 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-neutral-600">
                        {item.name} x {item.quantity}
                      </span>
                      <span className="font-semibold">€{(item.price * item.quantity).toLocaleString("de-DE")}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span>{settings.display.currencySymbol}{subtotal.toLocaleString(settings.display.currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Shipping</span>
                    {shipping > 0 ? (
                      <span>{settings.display.currencySymbol}{shipping.toLocaleString(settings.display.currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    ) : (
                      <span className="text-green-600 font-semibold">Free</span>
                    )}
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Tax</span>
                    <span>{settings.display.currencySymbol}{tax.toLocaleString(settings.display.currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold text-neutral-900">
                  <span>Total</span>
                  <span>{settings.display.currencySymbol}{total.toLocaleString(settings.display.currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <Link href="/cart" className="text-center block mt-6 text-neutral-600 hover:text-neutral-900 text-sm">
                  Back to Cart
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}


export default function CheckoutPage() {
  return (
    <CheckoutWrapper>
      <CheckoutPageContent />
    </CheckoutWrapper>
  )
}
