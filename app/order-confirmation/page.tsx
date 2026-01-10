"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Suspense } from "react"
import OrderConfirmationContent from "./order-confirmation-content"

export default function OrderConfirmationPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Suspense fallback={<div className="pt-32 pb-20 text-center">Loading order details...</div>}>
        <OrderConfirmationContent />
      </Suspense>
      <Footer />
    </main>
  )
}
