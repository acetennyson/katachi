"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import settings from "@/lib/constants/settings"
import { trackAddToCart, trackRemoveFromCart, trackCartUpdate } from "@/lib/analytics"

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  materials?: string[]
  tax_percentage?: number
  shipping_price?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotals: () => { subtotal: number; tax: number; shipping: number; total: number }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cart")
    if (saved) {
      try {
        setItems(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load cart:", e)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("cart", JSON.stringify(items))
    }
  }, [items, isHydrated])

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === newItem.productId)
      const updated = existing
        ? prev.map((item) =>
            item.productId === newItem.productId ? { ...item, quantity: item.quantity + newItem.quantity } : item,
          )
        : [...prev, newItem]
      
      // Track analytics
      const totals = updated.reduce((sum, item) => sum + item.price * item.quantity, 0)
      trackAddToCart({
        product_id: newItem.productId,
        product_name: newItem.name,
        quantity: newItem.quantity,
        price: newItem.price,
        cart_total: totals,
      })
      
      return updated
    })
  }

  const removeItem = (productId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.productId === productId)
      if (item) {
        trackRemoveFromCart(productId, item.name)
      }
      return prev.filter((item) => item.productId !== productId)
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) => {
      const item = prev.find((i) => i.productId === productId)
      if (item) {
        trackCartUpdate(productId, quantity)
      }
      return prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    })
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    
    // Calculate tax based on each item's tax_percentage (use site default if not specified)
    const tax = items.reduce((sum, item) => {
      const itemTotal = item.price * item.quantity
      const taxPercent = item.tax_percentage ?? settings.defaults.taxPercentage
      return sum + (itemTotal * taxPercent / 100)
    }, 0)
    
    // Calculate shipping (sum of shipping prices for each item, not multiplied by quantity)
    const shipping = items.reduce((sum, item) => {
      return sum + (item.shipping_price ?? settings.defaults.shippingPrice)
    }, 0)
    
    return { 
      subtotal, 
      tax: Math.round(tax * 100) / 100, 
      shipping: Math.round(shipping * 100) / 100,
      total: Math.round((subtotal + tax + shipping) * 100) / 100 
    }
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, getTotals }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within CartProvider")
  }
  return context
}
