"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CreditCard, Plus, Check } from "lucide-react"

interface SavedCard {
  id: string
  brand: string
  last4: string
  exp_month: number
  exp_year: number
  isDefault?: boolean
}

interface SavedCardsProps {
  userId: string
  onSelectCard: (cardId: string | null) => void
  selectedCardId: string | null
}

export default function SavedCards({ userId, onSelectCard, selectedCardId }: SavedCardsProps) {
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCard, setShowNewCard] = useState(false)

  useEffect(() => {
    loadSavedCards()
  }, [userId])

  const loadSavedCards = async () => {
    try {
      const response = await fetch(`/api/payments/saved-cards?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setSavedCards(data.cards || [])
        
        // Auto-select default card
        const defaultCard = data.cards?.find((c: SavedCard) => c.isDefault)
        if (defaultCard && !selectedCardId) {
          onSelectCard(defaultCard.id)
        }
      }
    } catch (error) {
      console.error("Failed to load saved cards:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCardBrandIcon = (brand: string) => {
    const brandLower = brand.toLowerCase()
    if (brandLower === "visa") return "💳"
    if (brandLower === "mastercard") return "💳"
    if (brandLower === "amex") return "💳"
    return "💳"
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
        <div className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Saved Cards */}
      {savedCards.map((card) => (
        <motion.button
          key={card.id}
          onClick={() => {
            onSelectCard(card.id)
            setShowNewCard(false)
          }}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            selectedCardId === card.id
              ? "border-neutral-900 bg-neutral-50"
              : "border-neutral-200 hover:border-neutral-300"
          }`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getCardBrandIcon(card.brand)}</span>
              <div>
                <p className="font-semibold text-neutral-900">
                  {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •••• {card.last4}
                </p>
                <p className="text-sm text-neutral-600">
                  Expires {String(card.exp_month).padStart(2, "0")}/{card.exp_year % 100}
                </p>
              </div>
            </div>
            {selectedCardId === card.id && (
              <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          {card.isDefault && (
            <span className="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
              Default
            </span>
          )}
        </motion.button>
      ))}

      {/* Use New Card Button */}
      <motion.button
        onClick={() => {
          onSelectCard(null)
          setShowNewCard(true)
        }}
        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
          showNewCard || selectedCardId === null
            ? "border-neutral-900 bg-neutral-50"
            : "border-neutral-200 hover:border-neutral-300"
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-neutral-600" />
            </div>
            <p className="font-semibold text-neutral-900">Use a new card</p>
          </div>
          {(showNewCard || selectedCardId === null) && (
            <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </motion.button>

      {savedCards.length === 0 && (
        <p className="text-sm text-neutral-500 text-center py-2">
          No saved cards yet. Your card will be saved for future purchases.
        </p>
      )}
    </div>
  )
}
