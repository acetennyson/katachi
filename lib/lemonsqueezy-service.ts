// Lemonsqueezy integration - Merchant of Record (no KYC required)
// They handle all taxes, fraud, and compliance globally

import {
  lemonSqueezySetup,
  createCheckout,
  getCheckout,
  listOrders,
  getOrder,
} from "@lemonsqueezy/lemonsqueezy.js"

interface LemonsqueezyConfig {
  apiKey: string
}

interface CheckoutResponse {
  id: string
  url: string
  custom_price?: number
}

interface OrderResponse {
  id: string
  identifier: string
  status: string
  total: number
  currency: string
  customer_id: number
}

class LemonsqueezyService {
  private apiKey: string

  constructor(config: LemonsqueezyConfig) {
    this.apiKey = config.apiKey
    // Initialize Lemonsqueezy SDK
    lemonSqueezySetup({ apiKey: this.apiKey })
    console.log('[Lemonsqueezy] Service initialized')
  }

  // Create checkout session
  async createCheckout(params: {
    storeId: string
    variantId: string
    customPrice?: number
    productOptions?: {
      name?: string
      description?: string
    }
    checkoutOptions?: {
      embed?: boolean
      media?: boolean
      logo?: boolean
      desc?: boolean
      discount?: boolean
      dark?: boolean
    }
    checkoutData?: {
      email?: string
      name?: string
      custom?: Record<string, any>
    }
    expiresAt?: string
    preview?: boolean
  }): Promise<CheckoutResponse> {
    try {
      console.log('[Lemonsqueezy] Creating checkout:', params)

      const checkoutData: any = {
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: params.checkoutData || {},
            product_options: params.productOptions || {},
            checkout_options: params.checkoutOptions || {},
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: params.storeId,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: params.variantId,
              },
            },
          },
        },
      }

      if (params.customPrice) {
        checkoutData.data.attributes.custom_price = params.customPrice
      }

      if (params.expiresAt) {
        checkoutData.data.attributes.expires_at = params.expiresAt
      }

      if (params.preview !== undefined) {
        checkoutData.data.attributes.preview = params.preview
      }

      const response = await createCheckout(
        checkoutData.data.relationships.store.data.id,
        checkoutData.data.relationships.variant.data.id,
        checkoutData.data.attributes
      )

      if (response.error) {
        console.error('[Lemonsqueezy] Checkout creation error:', response.error)
        throw new Error(response.error.message || 'Failed to create checkout')
      }

      console.log('[Lemonsqueezy] Checkout created:', response.data?.id)

      return {
        id: response.data?.id || '',
        url: response.data?.attributes?.url || '',
        custom_price: response.data?.attributes?.custom_price,
      }
    } catch (error: any) {
      console.error('[Lemonsqueezy] Checkout creation failed:', error)
      throw new Error(`Lemonsqueezy checkout failed: ${error.message}`)
    }
  }

  // Get checkout details
  async getCheckout(checkoutId: string): Promise<any> {
    try {
      const response = await getCheckout(checkoutId)
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to get checkout')
      }

      return response.data
    } catch (error: any) {
      console.error('[Lemonsqueezy] Get checkout failed:', error)
      throw new Error(`Failed to get checkout: ${error.message}`)
    }
  }

  // Get order details
  async getOrder(orderId: string): Promise<OrderResponse> {
    try {
      const response = await getOrder(orderId)
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to get order')
      }

      const order = response.data
      return {
        id: order?.id || '',
        identifier: order?.attributes?.identifier || '',
        status: order?.attributes?.status || '',
        total: order?.attributes?.total || 0,
        currency: order?.attributes?.currency || 'USD',
        customer_id: order?.attributes?.customer_id || 0,
      }
    } catch (error: any) {
      console.error('[Lemonsqueezy] Get order failed:', error)
      throw new Error(`Failed to get order: ${error.message}`)
    }
  }

  // List orders
  async listOrders(params?: {
    storeId?: string
    email?: string
    page?: number
    perPage?: number
  }): Promise<any[]> {
    try {
      const response = await listOrders({
        filter: {
          storeId: params?.storeId,
          userEmail: params?.email,
        },
        page: {
          number: params?.page || 1,
          size: params?.perPage || 10,
        },
      })
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to list orders')
      }

      return response.data || []
    } catch (error: any) {
      console.error('[Lemonsqueezy] List orders failed:', error)
      throw new Error(`Failed to list orders: ${error.message}`)
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const crypto = require('crypto')
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(payload)
      const expectedSignature = hmac.digest('hex')

      const isValid = expectedSignature === signature
      
      if (isValid) {
        console.log('[Lemonsqueezy] ✅ Webhook signature verified')
      } else {
        console.error('[Lemonsqueezy] ❌ Invalid webhook signature')
      }
      
      return isValid
    } catch (error) {
      console.error('[Lemonsqueezy] Signature verification error:', error)
      return false
    }
  }
}

// Export singleton instance
let lemonsqueezyInstance: LemonsqueezyService | null = null

export function getLemonsqueezyService(): LemonsqueezyService {
  if (!lemonsqueezyInstance) {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY
    
    if (!apiKey) {
      throw new Error('LEMONSQUEEZY_API_KEY not configured')
    }

    lemonsqueezyInstance = new LemonsqueezyService({
      apiKey,
    })
  }

  return lemonsqueezyInstance
}

export default LemonsqueezyService
