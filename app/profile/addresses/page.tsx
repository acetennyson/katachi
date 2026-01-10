"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Plus, Trash2 } from "lucide-react"

interface Address {
  id: string
  label: string
  line1: string
  city: string
  postal: string
  country: string
  is_default: boolean
}

export default function AddressesPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: "1",
      label: "Home",
      line1: "123 Main Street",
      city: "Brussels",
      postal: "1000",
      country: "Belgium",
      is_default: true,
    },
  ])

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
      <div className="container-custom max-w-4xl">
        <Link href="/profile" className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-8">
          <ChevronLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <Reveal>
          <h1 className="text-4xl font-bold mb-12 text-neutral-900">Saved Addresses</h1>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="space-y-6">
            {addresses.map((address) => (
              <motion.div
                key={address.id}
                className="p-6 border border-neutral-200 rounded-lg"
                initial={{ opacity: 0 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{address.label}</h3>
                    {address.is_default && <span className="text-xs text-green-600 font-medium">Default</span>}
                  </div>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-neutral-600 text-sm">
                  {address.line1}
                  <br />
                  {address.city}, {address.postal} {address.country}
                </p>
              </motion.div>
            ))}

            <div className="p-6 border-2 border-dashed border-neutral-300 rounded-lg">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add New Address
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Label"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Street Address"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="City" className="px-4 py-2 border border-neutral-200 rounded-lg" />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    className="px-4 py-2 border border-neutral-200 rounded-lg"
                  />
                </div>
                <Button className="w-full bg-neutral-900 text-white hover:bg-neutral-800">Add Address</Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}
