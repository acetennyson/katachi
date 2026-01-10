"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default function AccountPage() {
  const router = useRouter()
  const { user, isLoading, signOut } = useAuth()
  const [formData, setFormData] = useState({ name: "", email: "" })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/signin")
      return
    }
    if (user) {
      setFormData({ name: user.name, email: user.email })
    }
  }, [user, isLoading, router])

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call to update profile
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    console.log("[v0] Profile saved:", formData)
  }

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
          <h1 className="text-4xl font-bold mb-12 text-neutral-900">Account Settings</h1>
        </Reveal>

        <Reveal delay={0.1}>
          <motion.div className="p-8 bg-neutral-50 rounded-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-neutral-100 text-neutral-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">Member Since</label>
                <p className="text-neutral-600">January 2024</p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button onClick={signOut} className="border border-neutral-200 bg-neutral-900 text-white hover:text-neutral-900 hover:border-neutral-900 hover:bg-neutral-50">
                  Sign Out
                </Button>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </div>
  )
}
