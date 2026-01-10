"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Check } from "lucide-react"
import { useEffect } from "react"

export default function SubscriptionPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/signin")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return null
  }

  return (
    <div className="pt-32 pb-20">
      <div className="container-custom max-w-2xl">
        <Link href="/profile" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <Reveal>
          <h1 className="text-4xl font-bold mb-12 text-neutral-900">Subscription Plan</h1>
        </Reveal>

        <Reveal delay={0.1}>
          <motion.div className="p-8 bg-neutral-50 rounded-lg" initial={{ opacity: 0 }}>
            <div className="mb-8 p-6 border border-neutral-200 rounded-lg bg-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">Free Plan</h3>
                  <p className="text-neutral-600 text-sm">Current plan</p>
                </div>
                <span className="text-lg font-bold text-green-600">€0/month</span>
              </div>
              <p className="text-neutral-600 text-sm mb-6">Upgrade to unlock premium features.</p>
              <Button className="bg-neutral-900 text-white hover:bg-neutral-800">Upgrade to Pro</Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-neutral-900">Free Plan Includes:</h4>
              <ul className="space-y-2 text-neutral-600">
                <li className="flex gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Free shipping on all orders</span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>6-week delivery</span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Lifetime guarantee</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </div>
  )
}
