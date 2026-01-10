"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ShoppingCart, Menu, User, Package, Settings, LogOut, Home, Grid } from "lucide-react"
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
          {/* Logo */}
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

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                {/* <button
                  className={cn(
                    "p-2 transition-colors",
                    isScrolled ? "text-neutral-900 hover:text-neutral-700" : "text-white hover:text-white/80",
                  )}
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </button> */}
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {/* User Info */}
                  {user && (
                    <div className="pb-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                          <User className="h-5 w-5 text-neutral-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.email}</span>
                          <span className="text-xs text-muted-foreground">Signed in</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-2 py-3 text-sm font-medium hover:bg-neutral-50 rounded-md transition-colors"
                  >
                    <Home className="h-5 w-5" />
                    Home
                  </Link>
                  <Link
                    href="/catalog"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-2 py-3 text-sm font-medium hover:bg-neutral-50 rounded-md transition-colors"
                  >
                    <Grid className="h-5 w-5" />
                    Catalog
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-2 py-3 text-sm font-medium hover:bg-neutral-50 rounded-md transition-colors relative"
                  >
                    <div className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {cartItemCount > 0 && (
                        <sup className="absolute -top-1 -right-1 text-white text-[9px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none" style={{ backgroundColor: '#dc2626' }}>
                          {displayCount}
                        </sup>
                      )}
                    </div>
                    Cart
                    {cartItemCount > 0 && (
                      <span className="ml-auto text-xs font-semibold text-neutral-500">
                        ({cartItemCount})
                      </span>
                    )}
                  </Link>

                  {user && (
                    <>
                      <div className="h-px bg-neutral-200 my-2" />
                      <Link
                        href="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-2 py-3 text-sm font-medium hover:bg-neutral-50 rounded-md transition-colors"
                      >
                        <User className="h-5 w-5" />
                        Profile
                      </Link>
                      <Link
                        href="/profile/orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-2 py-3 text-sm font-medium hover:bg-neutral-50 rounded-md transition-colors"
                      >
                        <Package className="h-5 w-5" />
                        My Orders
                      </Link>
                      <Link
                        href="/profile/addresses"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-2 py-3 text-sm font-medium hover:bg-neutral-50 rounded-md transition-colors"
                      >
                        <Home className="h-5 w-5" />
                        Addresses
                      </Link>
                      <Link
                        href="/profile/account"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-2 py-3 text-sm font-medium hover:bg-neutral-50 rounded-md transition-colors"
                      >
                        <Settings className="h-5 w-5" />
                        Settings
                      </Link>
                    </>
                  )}

                  {/* Sign In/Out */}
                  <div className="h-px bg-neutral-200 my-2" />
                  {user ? (
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-2 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  ) : (
                    <Link
                      href="/auth/signin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-2 py-3 text-sm font-medium hover:bg-neutral-50 rounded-md transition-colors"
                    >
                      <User className="h-5 w-5" />
                      Sign In
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Cart Icon with Badge */}
          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
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
