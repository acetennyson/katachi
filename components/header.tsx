"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ShoppingCart, Menu, User, Package, Settings, LogOut, Home, Grid, MessageSquare, MapPin } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { items } = useCart()
  const router = useRouter()

  // Calculate total item count
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0)
  const displayCount = cartItemCount >= 10 ? "9+" : cartItemCount.toString()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = () => {
    signOut()
    router.push("/")
    setIsMobileMenuOpen(false)
  }

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "backdrop-blur-md border-b border-white/[0.02]",
        isScrolled ? "bg-white/[0.02] shadow-md" : "bg-white/[0.02]",
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-12 lg:h-16">
          {/* Logo - Always on the left */}
          <motion.div className="flex-shrink-0" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Link
              href="/"
              className={cn(
                "text-xl lg:text-2xl font-bold tracking-tight transition-colors",
                isScrolled ? "text-neutral-900 hover:text-neutral-700" : "text-white hover:text-white/80",
              )}
              aria-label="KATACHI Studio Home"
            >
              KATACHI
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/catalog"
              className={cn(
                "text-sm font-medium transition-colors",
                isScrolled ? "text-neutral-900 hover:text-neutral-700" : "text-white hover:text-white/80",
              )}
            >
              Catalog
            </Link>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors focus:outline-none",
                      isScrolled ? "text-neutral-900 hover:text-neutral-700" : "text-white hover:text-white/80",
                    )}
                  >
                    <User className="h-4 w-4" />
                    Account
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        Manage your account
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/addresses" className="cursor-pointer">
                      <Home className="mr-2 h-4 w-4" />
                      Addresses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/account" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/auth/signin"
                className={cn(
                  "text-sm font-medium transition-colors",
                  isScrolled ? "text-neutral-900 hover:text-neutral-700" : "text-white hover:text-white/80",
                )}
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile Actions - Cart and Hamburger on the right - ONLY ON MOBILE */}
          <div className="flex items-center gap-3 md:hidden">
            <Link href="/cart" className="relative" aria-label="Shopping Cart">
              <ShoppingCart
                className={cn(
                  "h-6 w-6 transition-colors",
                  isScrolled ? "text-neutral-900" : "text-white",
                )}
              />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {displayCount}
                </span>
              )}
            </Link>
            
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      "p-2 transition-colors",
                      isScrolled ? "text-neutral-900 hover:text-neutral-700" : "text-white hover:text-white/80",
                    )}
                    aria-label="Open menu"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[400px] p-0 bg-white">
                  <div className="flex flex-col h-full">
                    {/* Elegant Header */}
                    <div className="px-8 py-8 border-b">
                      <h2 className="text-3xl font-bold tracking-tight text-neutral-900">KATACHI</h2>
                      <p className="text-sm text-neutral-500 mt-2 font-light">Quality products for modern living</p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      <div className="flex flex-col gap-1">
                    {/* User Info - Elegant */}
                    {user && (
                      <div className="pb-6 mb-4 border-b">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-neutral-900">{user.email}</span>
                            <span className="text-xs text-neutral-500">Welcome back</span>
                          </div>
                        </div>
                      </div>
                    )}

                        {/* Navigation Links - Elegant & Minimal */}
                        <nav className="space-y-2">
                          <Link
                            href="/"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-between py-4 px-2 text-base font-medium text-neutral-900 hover:text-neutral-600 transition-colors border-b border-neutral-100 group"
                          >
                            <span className="tracking-wide">Home</span>
                            <Home className="h-5 w-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                          </Link>
                          <Link
                            href="/catalog"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-between py-4 px-2 text-base font-medium text-neutral-900 hover:text-neutral-600 transition-colors border-b border-neutral-100 group"
                          >
                            <span className="tracking-wide">Catalog</span>
                            <Grid className="h-5 w-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                          </Link>
                          <Link
                            href="/track"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-between py-4 px-2 text-base font-medium text-neutral-900 hover:text-neutral-600 transition-colors border-b border-neutral-100 group"
                          >
                            <span className="tracking-wide">Track Order</span>
                            <MapPin className="h-5 w-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                          </Link>
                          <Link
                            href="/cart"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-between py-4 px-2 text-base font-medium text-neutral-900 hover:text-neutral-600 transition-colors border-b border-neutral-100 group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="tracking-wide">Cart</span>
                              {cartItemCount > 0 && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-neutral-900 text-white rounded-full">
                                  {cartItemCount}
                                </span>
                              )}
                            </div>
                            <ShoppingCart className="h-5 w-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                          </Link>
                          <Link
                            href="/messages"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center justify-between py-4 px-2 text-base font-medium text-neutral-900 hover:text-neutral-600 transition-colors border-b border-neutral-100 group"
                          >
                            <span className="tracking-wide">Messages</span>
                            <MessageSquare className="h-5 w-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                          </Link>
                        </nav>

                        {/* Account Section - Elegant */}
                        {user ? (
                          <div className="mt-8 pt-6 border-t space-y-2">
                            <p className="text-xs uppercase tracking-widest text-neutral-400 font-semibold px-2 mb-4">Account</p>
                            <Link
                              href="/profile"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center justify-between py-4 px-2 text-base font-medium text-neutral-900 hover:text-neutral-600 transition-colors border-b border-neutral-100 group"
                            >
                              <span className="tracking-wide">Profile</span>
                              <User className="h-5 w-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                            </Link>
                            <Link
                              href="/profile/orders"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center justify-between py-4 px-2 text-base font-medium text-neutral-900 hover:text-neutral-600 transition-colors border-b border-neutral-100 group"
                            >
                              <span className="tracking-wide">My Orders</span>
                              <Package className="h-5 w-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                            </Link>
                            <button
                              onClick={() => {
                                handleSignOut()
                                setIsMobileMenuOpen(false)
                              }}
                              className="flex items-center justify-between py-4 px-2 text-base font-medium text-red-600 hover:text-red-700 transition-colors w-full group"
                            >
                              <span className="tracking-wide">Sign Out</span>
                              <LogOut className="h-5 w-5 text-red-400 group-hover:text-red-600 transition-colors" />
                            </button>
                          </div>
                        ) : (
                          <div className="mt-8 pt-6 border-t">
                            <Link
                              href="/auth/signin"
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center justify-center gap-3 py-4 text-base font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition-colors tracking-wide"
                            >
                              Sign In
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
          </div>

          {/* Desktop Cart Icon - ONLY ON DESKTOP */}
          <motion.div className="hidden md:block max-md:hidden" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Link
              href="/cart"
              className={cn(
                "p-2 rounded-lg transition-colors relative inline-block",
                isScrolled ? "text-neutral-900 hover:bg-neutral-100" : "text-white hover:bg-white/10",
              )}
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <sup className="absolute -top-0.5 -right-0.5 text-[9px] bg-white text-shadow-2xs font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none text-red-600 border border-[#dc2626]" >
                  {displayCount}
                </sup>
              )}
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}
