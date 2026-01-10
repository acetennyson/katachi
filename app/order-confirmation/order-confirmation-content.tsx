"use client"

import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")

  return (
    <div className="pt-32 pb-20">
      <div className="container-custom max-w-2xl mx-auto">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Reveal>
            <motion.div
              className="flex justify-center mb-6"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <CheckCircle className="w-16 h-16 text-green-500" />
            </motion.div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-4">Order Confirmed!</h1>
            <p className="text-lg text-neutral-600 mb-8">
              Thank you for your purchase. Your order has been placed successfully.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="p-8 bg-neutral-50 rounded-lg mb-8">
              <p className="text-neutral-600 mb-2">Order Number</p>
              <p className="text-2xl font-bold text-neutral-900">{orderId}</p>
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="space-y-4 mb-12">
              <p className="text-neutral-600">
                A confirmation email has been sent to your email address with details about your order.
              </p>
              <p className="text-neutral-600">You can track your order status from your account profile.</p>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/profile"
                className="px-8 py-3 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition-colors"
              >
                View Order in Profile
              </Link>
              <Link
                href="/catalog"
                className="px-8 py-3 border-2 border-neutral-900 text-neutral-900 rounded-lg font-semibold hover:bg-neutral-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </Reveal>
        </motion.div>
      </div>
    </div>
  )
}
