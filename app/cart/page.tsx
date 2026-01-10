"use client"

import { useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import settings from "@/lib/constants/settings"
import { trackPageView, trackRemoveFromCart } from "@/lib/analytics"

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotals } = useCart()
  const { subtotal, tax, shipping, total } = getTotals()

  // Track page view on mount
  useEffect(() => {
    trackPageView("/cart")
  }, [])

  const handleRemoveItem = (productId: string, productName: string) => {
    trackRemoveFromCart(productId, productName)
    removeItem(productId)
  }

  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-32 pb-20">
        <div className="container-custom">
          <Reveal>
            <h1 className="text-5xl md:text-6xl font-bold mb-12 text-neutral-900">Shopping Cart</h1>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              {items.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-lg text-neutral-600 mb-6">Your cart is empty</p>
                  <Link href="/catalog" className="inline-block">
                    <Button className="bg-neutral-900 text-white hover:bg-neutral-800">Continue Shopping</Button>
                  </Link>
                </div>
              ) : (
                <motion.div
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1 },
                    },
                  }}
                >
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      className="flex gap-6 p-6 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-all"
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 },
                      }}
                    >
                      <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100">
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900 mb-2">{item.name}</h3>
                        <p className="text-sm text-neutral-600 mb-2">{item.materials?.join(", ")}</p>
                        <p className="text-lg font-bold text-neutral-900">€{item.price.toLocaleString("de-DE")}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-neutral-300 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="px-3 py-1 hover:bg-neutral-100"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, Number.parseInt(e.target.value) || 1)}
                            className="w-12 text-center border-l border-r border-neutral-300 focus:outline-none"
                            min="1"
                          />
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="px-3 py-1 hover:bg-neutral-100"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.productId, item.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Order Summary */}
            {items.length > 0 && (
              <Reveal delay={0.2}>
                <motion.div className="p-8 bg-neutral-50 rounded-lg h-fit sticky top-32">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-6">Order Summary</h2>

                  <div className="space-y-3 mb-6 pb-6 border-b border-neutral-200">
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

                  <div className="flex justify-between text-lg font-bold text-neutral-900 mb-6">
                    <span>Total</span>
                    <span>{settings.display.currencySymbol}{total.toLocaleString(settings.display.currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <Link href="/checkout" className="w-full block">
                    <Button className="w-full bg-neutral-900 text-white hover:bg-neutral-800 py-3 text-lg rounded-lg">
                      Proceed to Checkout
                    </Button>
                  </Link>

                  <Link href="/catalog" className="w-full block mt-3">
                    <button className="w-full py-3 text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded-lg transition-colors">
                      Continue Shopping
                    </button>
                  </Link>
                </motion.div>
              </Reveal>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
