import settings from "@/lib/constants/settings"

/**
 * Get the tax rate for a specific country code
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "US", "DE", "FR")
 * @returns Tax percentage for the country, or default if not found
 */
export function getTaxRateForCountry(countryCode: string): number {
  const upperCode = countryCode.toUpperCase()
  return settings.taxRates[upperCode] ?? settings.defaults.taxPercentage
}

/**
 * Detect country from various sources
 * Priority: User preference > Shipping address > Browser locale > IP geolocation
 */
export function detectCountry(options?: {
  shippingCountry?: string
  userCountry?: string
  browserLocale?: string
}): string {
  // 1. User preference (from shipping address or profile)
  if (options?.shippingCountry) {
    return options.shippingCountry
  }

  if (options?.userCountry) {
    return options.userCountry
  }

  // 2. Browser locale (navigator.language)
  if (options?.browserLocale) {
    const parts = options.browserLocale.split("-")
    if (parts.length > 1) {
      return parts[1].toUpperCase()
    }
  }

  // 3. Default to US if no detection possible
  return "US"
}

/**
 * Calculate tax for an item based on country
 */
export function calculateTaxForItem(
  price: number,
  quantity: number,
  countryCode: string,
  customTaxRate?: number
): number {
  const taxRate = customTaxRate ?? getTaxRateForCountry(countryCode)
  const subtotal = price * quantity
  return subtotal * (taxRate / 100)
}

/**
 * Calculate total tax for multiple items
 */
export function calculateTotalTax(
  items: Array<{
    price: number
    quantity: number
    tax_percentage?: number
  }>,
  countryCode?: string
): number {
  return items.reduce((total, item) => {
    const taxRate = item.tax_percentage ?? (countryCode ? getTaxRateForCountry(countryCode) : settings.defaults.taxPercentage)
    const itemTotal = item.price * item.quantity
    return total + (itemTotal * taxRate / 100)
  }, 0)
}

/**
 * Format tax rate for display
 */
export function formatTaxRate(taxRate: number): string {
  return `${taxRate.toFixed(2)}%`
}

/**
 * Get country name from country code
 */
export function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    AT: "Austria",
    BE: "Belgium",
    BG: "Bulgaria",
    HR: "Croatia",
    CY: "Cyprus",
    CZ: "Czech Republic",
    DK: "Denmark",
    EE: "Estonia",
    FI: "Finland",
    FR: "France",
    DE: "Germany",
    GR: "Greece",
    HU: "Hungary",
    IE: "Ireland",
    IT: "Italy",
    LV: "Latvia",
    LT: "Lithuania",
    LU: "Luxembourg",
    MT: "Malta",
    NL: "Netherlands",
    PL: "Poland",
    PT: "Portugal",
    RO: "Romania",
    SK: "Slovakia",
    SI: "Slovenia",
    ES: "Spain",
    SE: "Sweden",
    US: "United States",
    GB: "United Kingdom",
    CH: "Switzerland",
    NO: "Norway",
    CA: "Canada",
    AU: "Australia",
    NZ: "New Zealand",
    JP: "Japan",
  }

  return countryNames[countryCode.toUpperCase()] || countryCode
}
