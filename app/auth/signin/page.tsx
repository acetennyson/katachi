"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Suspense } from "react"
import SignInContent from "./signin-content"

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
        <SignInContent />
      </Suspense>
      <Footer />
    </main>
  )
}
