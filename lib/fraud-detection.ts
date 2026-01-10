// Fraud detection utilities for preventing card reuse

interface CardUsageCheck {
  isNewCard: boolean
  usageCount: number
  uniqueUsers: number
  uniqueEmails: number
  isSuspicious: boolean
  message: string
}

/**
 * Check if a card fingerprint has been used before
 * Use this before granting free trials, bonuses, or promotional offers
 */
export async function checkCardUsage(cardFingerprint: string): Promise<CardUsageCheck> {
  try {
    const response = await fetch(`/api/payments/track-card?fingerprint=${cardFingerprint}`)
    
    if (!response.ok) {
      throw new Error("Failed to check card usage")
    }

    const data = await response.json()

    const isNewCard = data.usageCount === 0
    const isSuspicious = 
      data.usageCount > 3 || // Used more than 3 times
      data.uniqueUsers > 1 || // Used by multiple users
      data.uniqueEmails > 1 // Used with multiple emails

    let message = ""
    if (isNewCard) {
      message = "Card is new - eligible for promotions"
    } else if (isSuspicious) {
      message = "Card flagged for suspicious activity - deny promotional offers"
    } else {
      message = `Card used ${data.usageCount} time(s) - use discretion`
    }

    return {
      isNewCard,
      usageCount: data.usageCount,
      uniqueUsers: data.uniqueUsers,
      uniqueEmails: data.uniqueEmails,
      isSuspicious,
      message,
    }
  } catch (error) {
    console.error("Failed to check card usage:", error)
    // Default to allowing if check fails (avoid blocking legitimate customers)
    return {
      isNewCard: true,
      usageCount: 0,
      uniqueUsers: 0,
      uniqueEmails: 0,
      isSuspicious: false,
      message: "Unable to verify card - proceeding with caution",
    }
  }
}

/**
 * Check if user is eligible for a promotional offer based on card usage
 */
export async function isEligibleForPromotion(
  cardFingerprint: string,
  promotionType: "free_trial" | "signup_bonus" | "discount_code"
): Promise<{ eligible: boolean; reason: string }> {
  const cardCheck = await checkCardUsage(cardFingerprint)

  // Different rules for different promotion types
  switch (promotionType) {
    case "free_trial":
      // Free trials: only allow new cards
      if (!cardCheck.isNewCard) {
        return {
          eligible: false,
          reason: "Card has been used before - free trial not available",
        }
      }
      break

    case "signup_bonus":
      // Signup bonuses: allow if not suspicious
      if (cardCheck.isSuspicious) {
        return {
          eligible: false,
          reason: "Card flagged for suspicious activity",
        }
      }
      break

    case "discount_code":
      // Discount codes: allow up to 3 uses
      if (cardCheck.usageCount > 3) {
        return {
          eligible: false,
          reason: "Card usage limit exceeded for discounts",
        }
      }
      break
  }

  return {
    eligible: true,
    reason: "Eligible for promotion",
  }
}

/**
 * Get all payments made with a specific card
 */
export async function getCardPaymentHistory(cardFingerprint: string) {
  try {
    const response = await fetch(`/api/payments/track-card?fingerprint=${cardFingerprint}`)
    
    if (!response.ok) {
      throw new Error("Failed to get card history")
    }

    const data = await response.json()
    return data.payments || []
  } catch (error) {
    console.error("Failed to get card history:", error)
    return []
  }
}
