"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export default function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn } = useAuth()
  const redirect = searchParams.get("redirect") || "/profile"

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signIn(formData.email, formData.password)
      router.push(redirect)
    } catch (err) {
      setError("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center pt-32 pb-20">
      <div className="container-custom w-full max-w-md">
        <Reveal>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">Sign In</h1>
            <p className="text-neutral-600">Welcome back to KATACHI</p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <motion.form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-900 text-white hover:bg-neutral-800 py-3 rounded-lg disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </motion.form>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-center text-neutral-600 mt-6">
            Do not have an account?{" "}
            <Link href="/auth/signup" className="font-semibold text-neutral-900 hover:underline">
              Create one
            </Link>
          </p>
        </Reveal>
      </div>
    </div>
  )
}
