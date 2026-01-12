import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "@/lib/cart-context"
import { AuthProvider } from "@/lib/auth-context"
import { AnalyticsProvider } from "@/components/analytics-provider"
import { AIChat } from "@/components/ai-chat"
import { AuthCallbackHandler } from "@/components/auth-callback-handler"
import { AuthLoadingScreen } from "@/components/auth-loading-screen"
import { Suspense } from "react"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Katachi — Quality Products for Modern Living",
  description: "Discover curated products across home decor, electronics, security and more. Quality items delivered to your door.",
  generator: "Someone",
  icons: {
    icon: "/favicon/favicon.ico",
    apple: "/favicon/apple-touch-icon.png"
  },
  alternates: {
    canonical: "https://katachi.example/",
  },
  openGraph: {
    siteName: "Katachi",
    title: "Quality Products for Modern Living | Katachi",
    description: "Discover curated products across home decor, electronics, security and more. Quality items delivered to your door.",
    type: "website",
    url: "https://katachi.example/",
    images: [
      {
        url: "/images/opengraph-katachi.jpeg",
        alt: "Katachi — Your destination for quality products",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_BE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quality Products for Modern Living | Katachi",
    description: "Discover curated products across furniture, home decor, electronics, and more. Quality items delivered to your door.",
    images: [
      {
        url: "/images/opengraph-katachi.jpeg",
        alt: "Katachi — Your destination for quality products",
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
              <Suspense fallback={null}>
                <AuthLoadingScreen />
              </Suspense>
              <AuthCallbackHandler />
              {children}
              <AIChat />
            </AnalyticsProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
