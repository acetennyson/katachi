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
  const { signIn, signInWithMagicLink } = useAuth()
  const redirect = searchParams.get("redirect") || "/profile"

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (useMagicLink) {
        await signInWithMagicLink(formData.email)
        setMagicLinkSent(true)
      } else {
        await signIn(formData.email, formData.password)
        router.push(redirect)
      }
    } catch (err) {
      setError(useMagicLink ? "Failed to send magic link" : "Invalid email or password")
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
          {magicLinkSent ? (
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Check your email!</h3>
              <p className="text-green-700 mb-4">
                We've sent a magic link to <strong>{formData.email}</strong>
              </p>
              <p className="text-sm text-green-600">Click the link in your email to sign in.</p>
              <Button
                onClick={() => {
                  setMagicLinkSent(false)
                  setUseMagicLink(false)
                }}
                className="mt-4 bg-green-700 hover:bg-green-800"
              >
                Back to sign in
              </Button>
            </div>
          ) : (
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

              {!useMagicLink && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-neutral-900">Password</label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!useMagicLink}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-white hover:bg-neutral-800 py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? (useMagicLink ? "Sending link..." : "Signing In...") : useMagicLink ? "Send Magic Link" : "Sign In"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-neutral-500">or</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setUseMagicLink(!useMagicLink)}
                variant="outline"
                className="w-full"
              >
                {useMagicLink ? "Sign in with password" : "Sign in with magic link"}
              </Button>
            </motion.form>
          )}
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
