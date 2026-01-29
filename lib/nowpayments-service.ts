// NOWPayments integration - crypto payment processor with fiat card support
// No KYC required for basic operations

interface NOWPaymentConfig {
  apiKey: string
  ipnSecret?: string
  sandbox?: boolean
}

interface PaymentResponse {
  id: string
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id: string
  order_description: string
  ipn_callback_url?: string
  created_at: string
  updated_at: string
  purchase_id: string
  invoice_url?: string
}

interface PaymentStatus {
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  actually_paid: number
  pay_currency: string
  order_id: string
  order_description: string
  created_at: string
  updated_at: string
  outcome_amount: number
  outcome_currency: string
}

class NOWPaymentsService {
  private apiKey: string
  private ipnSecret?: string
  private baseUrl: string

  constructor(config: NOWPaymentConfig) {
    this.apiKey = config.apiKey
    this.ipnSecret = config.ipnSecret
    // NOWPayments doesn't have a separate sandbox URL
    // Use sandbox API key with production URL for testing
    this.baseUrl = 'https://api.nowpayments.io/v1'
    
    if (config.sandbox) {
      console.log('[NOWPayments] Running in SANDBOX mode with sandbox API key')
    }
  }

  private async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    const headers: HeadersInit = {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const url = `${this.baseUrl}${endpoint}`
    console.log('[NOWPayments] Making request:', { url, method, sandbox: this.baseUrl.includes('sandbox') })

    try {
      const response = await fetch(url, options)

      console.log('[NOWPayments] Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[NOWPayments] Error response:', errorText)
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText || 'Unknown error' }
        }
        
        throw new Error(`NOWPayments API Error (${response.status}): ${errorData.message || response.statusText}`)
      }

      const responseData = await response.json()
      console.log('[NOWPayments] Success response:', responseData)
      return responseData
    } catch (error: any) {
      console.error('[NOWPayments] Request failed:', {
        error: error.message,
        cause: error.cause,
        url,
      })
      throw error
    }
  }

  // Get available currencies
  async getAvailableCurrencies(): Promise<string[]> {
    const response = await this.makeRequest('/currencies')
    return response.currencies || []
  }

  // Get minimum payment amount
  async getMinimumAmount(currency: string): Promise<number> {
    const response = await this.makeRequest(`/min-amount?currency_from=usd&currency_to=${currency}`)
    return response.min_amount || 0
  }

  // Create payment
  async createPayment(params: {
    price_amount: number
    price_currency: string
    pay_currency?: string
    order_id: string
    order_description: string
    ipn_callback_url?: string
    success_url?: string
    cancel_url?: string
  }): Promise<PaymentResponse> {
    return this.makeRequest('/payment', 'POST', params)
  }

  // Create invoice (easier for customers - shows all payment options)
  async createInvoice(params: {
    price_amount: number
    price_currency: string
    order_id: string
    order_description: string
    ipn_callback_url?: string
    success_url?: string
    cancel_url?: string
  }): Promise<any> {
    return this.makeRequest('/invoice', 'POST', params)
  }

  // Get payment status
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    return this.makeRequest(`/payment/${paymentId}`)
  }

  // Verify IPN callback
  verifyIPN(receivedSignature: string, payload: string): boolean {
    if (!this.ipnSecret) {
      console.warn('IPN secret not configured')
      return false
    }

    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha512', this.ipnSecret)
    hmac.update(payload)
    const calculatedSignature = hmac.digest('hex')

    return calculatedSignature === receivedSignature
  }
}

// Export singleton instance
let nowPaymentsInstance: NOWPaymentsService | null = null

export function getNOWPaymentsService(): NOWPaymentsService {
  if (!nowPaymentsInstance) {
    const apiKey = process.env.NOWPAYMENTS_API_KEY
    
    if (!apiKey) {
      throw new Error('NOWPAYMENTS_API_KEY not configured')
    }

    nowPaymentsInstance = new NOWPaymentsService({
      apiKey,
      ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET,
      sandbox: process.env.NOWPAYMENTS_SANDBOX === 'true',
    })
  }

  return nowPaymentsInstance
}

export default NOWPaymentsService
