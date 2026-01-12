"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    // Check if coming from verified email link
    const verified = searchParams.get("verified")
    if (verified === "true") {
      setIsVerified(true)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      await updatePassword(password)
      setSuccess(true)
      setTimeout(() => {
        router.push("/auth/signin")
      }, 2000)
    } catch (err) {
      setError("Failed to update password. Please try again or request a new reset link.")
    } finally {
      setLoading(false)
    }
  }

  if (!isVerified) {
    return (
      <div className="flex-1 flex items-center justify-center pt-32 pb-20 min-h-screen">
        <div className="container-custom w-full max-w-md">
          <Reveal>
            <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Invalid or Expired Link</h3>
              <p className="text-yellow-700 mb-4">
                This password reset link is invalid or has expired.
              </p>
              <Link href="/auth/forgot-password">
                <Button className="bg-yellow-700 hover:bg-yellow-800">
                  Request New Reset Link
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center pt-32 pb-20 min-h-screen">
      <div className="container-custom w-full max-w-md">
        <Reveal>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">Set New Password</h1>
            <p className="text-neutral-600">Enter your new password below</p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {success ? (
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Password Updated!</h3>
              <p className="text-green-700">Redirecting you to sign in...</p>
            </div>
          ) : (
            <motion.form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-white hover:bg-neutral-800 py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </motion.form>
          )}
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-center text-neutral-600 mt-6">
            <Link href="/auth/signin" className="font-semibold text-neutral-900 hover:underline">
              Back to sign in
            </Link>
          </p>
        </Reveal>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center pt-32 pb-20 min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900"></div>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
      <Footer />
    </>
  )
}
