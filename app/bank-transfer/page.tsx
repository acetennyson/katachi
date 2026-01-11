"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { Building2, Copy, Check, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"

interface BankDetails {
  accountName: string
  accountNumber: string
  bankName: string
  bic: string
  reference: string
  amount: number
  currency: string
}

function BankTransferContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    loadBankDetails()
  }, [])

  const loadBankDetails = async () => {
    try {
      // In production, fetch from API
      // For now, use mock data
      const mockDetails: BankDetails = {
        accountName: "Katachi Furniture Store",
        accountNumber: "BE68 5390 0754 7034",
        bankName: "BNP Paribas Fortis",
        bic: "GKCCBEBB",
        reference: `REF-${orderId || "ORDER"}-${Date.now().toString(36).toUpperCase()}`,
        amount: parseFloat(searchParams.get("amount") || "0"),
        currency: searchParams.get("currency") || "EUR",
      }
      setBankDetails(mockDetails)
    } catch (error) {
      console.error("Failed to load bank details:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-32 pb-20">
          <div className="container-custom max-w-3xl text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-64 mx-auto mb-4" />
              <div className="h-4 bg-neutral-200 rounded w-96 mx-auto" />
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (!bankDetails) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="pt-32 pb-20">
          <div className="container-custom max-w-3xl text-center">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">Error Loading Bank Details</h1>
            <Link href="/cart" className="text-neutral-600 hover:text-neutral-900">
              Return to Cart
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <Header />
      <div className="pt-32 pb-20">
        <div className="container-custom max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Bank Transfer Instructions</h1>
            <p className="text-neutral-600">
              Please complete the bank transfer using the details below
            </p>
          </motion.div>

          {/* Bank Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-6"
          >
            <h2 className="text-xl font-bold text-neutral-900 mb-6">Transfer Details</h2>

            <div className="space-y-4">
              {/* Account Name */}
              <DetailRow
                label="Account Name"
                value={bankDetails.accountName}
                onCopy={() => copyToClipboard(bankDetails.accountName, "accountName")}
                copied={copiedField === "accountName"}
              />

              {/* Account Number / IBAN */}
              <DetailRow
                label="Account Number (IBAN)"
                value={bankDetails.accountNumber}
                onCopy={() => copyToClipboard(bankDetails.accountNumber, "accountNumber")}
                copied={copiedField === "accountNumber"}
              />

              {/* Bank Name */}
              <DetailRow
                label="Bank Name"
                value={bankDetails.bankName}
                onCopy={() => copyToClipboard(bankDetails.bankName, "bankName")}
                copied={copiedField === "bankName"}
              />

              {/* BIC/SWIFT */}
              <DetailRow
                label="BIC/SWIFT Code"
                value={bankDetails.bic}
                onCopy={() => copyToClipboard(bankDetails.bic, "bic")}
                copied={copiedField === "bic"}
              />

              {/* Amount */}
              <div className="border-t border-neutral-200 pt-4 mt-4">
                <DetailRow
                  label="Amount to Transfer"
                  value={`${bankDetails.currency} ${bankDetails.amount.toFixed(2)}`}
                  onCopy={() => copyToClipboard(bankDetails.amount.toFixed(2), "amount")}
                  copied={copiedField === "amount"}
                  highlighted
                />
              </div>

              {/* Reference - IMPORTANT */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold mt-0.5">
                    !
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">Important: Include Reference</p>
                    <p className="text-sm text-amber-700">
                      Please include this reference number in your transfer
                    </p>
                  </div>
                </div>
                <DetailRow
                  label="Payment Reference"
                  value={bankDetails.reference}
                  onCopy={() => copyToClipboard(bankDetails.reference, "reference")}
                  copied={copiedField === "reference"}
                  important
                />
              </div>
            </div>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-6"
          >
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Next Steps</h3>
            <ol className="space-y-3 text-neutral-700">
              <li className="flex gap-3">
                <span className="font-bold text-neutral-900">1.</span>
                <span>Use your bank's online banking or mobile app to initiate a transfer</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-neutral-900">2.</span>
                <span>Enter the account details exactly as shown above</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-neutral-900">3.</span>
                <span>
                  <strong>Include the payment reference</strong> - This is crucial for us to identify your payment
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-neutral-900">4.</span>
                <span>Processing typically takes 1-3 business days</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-neutral-900">5.</span>
                <span>You'll receive a confirmation email once we receive your payment</span>
              </li>
            </ol>
          </motion.div>

          {/* Email Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6"
          >
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">Check Your Email</p>
                <p className="text-sm text-blue-700">
                  We've sent these details to your email address for your records
                </p>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              href="/order-confirmation?orderId={orderId}"
              className="flex-1 bg-neutral-900 text-white py-4 rounded-lg font-semibold hover:bg-neutral-800 text-center"
            >
              View Order Details
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-4 border-2 border-neutral-200 rounded-lg font-semibold hover:border-neutral-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}

function DetailRow({
  label,
  value,
  onCopy,
  copied,
  highlighted = false,
  important = false,
}: {
  label: string
  value: string
  onCopy: () => void
  copied: boolean
  highlighted?: boolean
  important?: boolean
}) {
  return (
    <div className={`flex items-center justify-between ${highlighted ? "bg-neutral-50 -mx-4 px-4 py-3 rounded-lg" : ""}`}>
      <div>
        <p className="text-sm text-neutral-600 mb-1">{label}</p>
        <p className={`font-mono ${important ? "text-lg font-bold" : "font-semibold"} text-neutral-900`}>
          {value}
        </p>
      </div>
      <button
        onClick={onCopy}
        className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">Copy</span>
          </>
        )}
      </button>
    </div>
  )
}

export default function BankTransferPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading bank details...</p>
          </div>
        </div>
        <Footer />
      </div>
    }>
      <BankTransferContent />
    </Suspense>
  )
}
