import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { AuthProvider } from "@/lib/auth-context"
import { AnalyticsProvider } from "@/components/analytics-provider"
import { AIChat } from "@/components/ai-chat"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Katachi — Design furniture for spaces that breathe.",
  description: "Architected in Belgium, built to last—timeless pieces.",
  generator: "v0.app",
  alternates: {
    canonical: "https://katachi.example/",
  },
  openGraph: {
    siteName: "Katachi",
    title: "Design furniture for spaces that breathe. | Katachi",
    description: "Architected in Belgium, built to last—timeless pieces.",
    type: "website",
    url: "https://katachi.example/",
    images: [
      {
        url: "/images/opengraph-katachi.jpeg",
        alt: "Katachi design furniture — timeless pieces, architected in Belgium",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_BE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Design furniture for spaces that breathe. | Katachi",
    description: "Architected in Belgium, built to last—timeless pieces.",
    images: [
      {
        url: "/images/opengraph-katachi.jpeg",
        alt: "Katachi design furniture — timeless pieces, architected in Belgium",
      },
    ],
    site: "@katachi",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans bg-neutral-50 text-neutral-900 overflow-x-hidden">
        <AuthProvider>
          <CartProvider>
            <AnalyticsProvider>
              {children}
              <AIChat />
            </AnalyticsProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
