"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { Header } from "@/components/header"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { User, Package, MapPin, Zap, ChevronRight, TrendingUp, Heart, CreditCard } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    savedAddresses: 0,
  })

  useEffect(() => {
    if (user) {
      // Fetch user stats
      fetchUserStats()
    }
  }, [user])

  const fetchUserStats = async () => {
    try {
      const response = await fetch("/api/orders", {
        headers: {
          "x-user-id": user?.id || "",
        },
      })
      const data = await response.json()
      if (data.success) {
        const total = data.orders.reduce((sum: number, order: any) => sum + parseFloat(order.total), 0)
        setStats({
          totalOrders: data.orders.length,
          totalSpent: total,
          savedAddresses: 0, // Will be fetched from addresses API later
        })
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/signin?redirect=/profile")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="pt-32 pb-20 flex items-center justify-center min-h-screen">
        <p className="text-neutral-600">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const sections = [
    {
      id: "account-settings",
      icon: User,
      title: "Account Settings",
      description: "Manage your profile information",
      href: "/profile/account",
      color: "bg-blue-50 text-blue-600",
    },
    {
      id: "orders",
      icon: Package,
      title: "Orders",
      description: "View your order history",
      href: "/profile/orders",
      color: "bg-green-50 text-green-600",
      badge: stats.totalOrders > 0 ? stats.totalOrders : null,
    },
    {
      id: "addresses",
      icon: MapPin,
      title: "Addresses",
      description: "Manage shipping addresses",
      href: "/profile/addresses",
      color: "bg-purple-50 text-purple-600",
    },
    {
      id: "payment-methods",
      icon: CreditCard,
      title: "Payment Methods",
      description: "Manage saved payment cards",
      href: "/profile/payment-methods",
      color: "bg-orange-50 text-orange-600",
    },
    {
      id: "wishlist",
      icon: Heart,
      title: "Wishlist",
      description: "Your favorite products",
      href: "/catalog",
      color: "bg-pink-50 text-pink-600",
    },
    {
      id: "subscription",
      icon: Zap,
      title: "Subscription",
      description: "Upgrade your plan",
      href: "/profile/subscription",
      color: "bg-yellow-50 text-yellow-600",
    },
  ]

  const quickStats = [
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: Package,
      color: "text-green-600",
    },
    {
      label: "Total Spent",
      value: `€${stats.totalSpent.toFixed(2)}`,
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      label: "Saved Addresses",
      value: stats.savedAddresses,
      icon: MapPin,
      color: "text-purple-600",
    },
  ]

  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-32 pb-20">
        <div className="container-custom">
          {/* Welcome Section */}
          <Reveal>
            <div className="mb-12">
              <h1 className="text-5xl md:text-6xl font-bold mb-4 text-neutral-900">My Account</h1>
              <p className="text-lg text-neutral-600">Welcome back, {user.email}</p>
            </div>
          </Reveal>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Reveal key={stat.label} delay={index * 0.1}>
                  <motion.div
                    className="p-6 bg-white border border-neutral-200 rounded-lg"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 bg-neutral-100 rounded-lg ${stat.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                        <p className="text-sm text-neutral-600">{stat.label}</p>
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              )
            })}
          </div>

          {/* Account Sections */}
          <Reveal>
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Manage Your Account</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section, index) => {
              const Icon = section.icon
              return (
                <Reveal key={section.id} delay={index * 0.1}>
                  <Link href={section.href}>
                    <motion.div
                      className="relative p-6 border border-neutral-200 rounded-lg hover:border-neutral-900 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                      whileHover={{ y: -4 }}
                    >
                      {section.badge && (
                        <div className="absolute top-4 right-4 bg-neutral-900 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                          {section.badge}
                        </div>
                      )}
                      <div className={`inline-flex p-3 rounded-lg mb-4 ${section.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900 mb-2">{section.title}</h3>
                      <p className="text-sm text-neutral-600 mb-4">{section.description}</p>
                      <div className="flex items-center text-neutral-900 text-sm font-medium">
                        Manage <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </motion.div>
                  </Link>
                </Reveal>
              )
            })}
          </div>

          {/* Quick Actions */}
          <Reveal delay={0.6}>
            <div className="mt-12 p-8 bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-lg text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Explore Our Catalog</h3>
                  <p className="text-neutral-300">Discover handcrafted furniture for your space</p>
                </div>
                <Link
                  href="/catalog"
                  className="px-8 py-3 bg-white text-neutral-900 rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
                >
                  Browse Collection
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  )
}
