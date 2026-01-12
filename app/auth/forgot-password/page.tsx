"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await resetPassword(email)
      setEmailSent(true)
    } catch (err) {
      setError("Failed to send password reset email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="flex-1 flex items-center justify-center pt-32 pb-20 min-h-screen">
        <div className="container-custom w-full max-w-md">
          <Reveal>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-neutral-900 mb-2">Reset Password</h1>
              <p className="text-neutral-600">Enter your email to receive a reset link</p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            {emailSent ? (
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Check your email!</h3>
                <p className="text-green-700 mb-4">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-green-600 mb-4">Click the link in your email to reset your password.</p>
                <Button onClick={() => setEmailSent(false)} className="bg-green-700 hover:bg-green-800">
                  Send another email
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                    placeholder="you@example.com"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neutral-900 text-white hover:bg-neutral-800 py-3 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </motion.form>
            )}
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-center text-neutral-600 mt-6">
              Remember your password?{" "}
              <Link href="/auth/signin" className="font-semibold text-neutral-900 hover:underline">
                Sign in
              </Link>
            </p>
          </Reveal>
        </div>
      </div>
      <Footer />
    </>
  )
}
