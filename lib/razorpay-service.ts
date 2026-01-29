// Razorpay integration - card payment processor with minimal KYC
// Supports India, Malaysia, Singapore, US, UK, EU

import Razorpay from "razorpay"

interface RazorpayConfig {
  keyId: string
  keySecret: string
}

interface OrderResponse {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: string
  created_at: number
}

interface PaymentResponse {
  id: string
  entity: string
  amount: number
  currency: string
  status: string
  order_id: string
  method: string
  captured: boolean
  created_at: number
}

class RazorpayService {
  private instance: Razorpay

  constructor(config: RazorpayConfig) {
    this.instance = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    })
  }

  // Create order (required before payment)
  async createOrder(params: {
    amount: number // in smallest currency unit (paise for INR, cents for USD)
    currency?: string
    receipt?: string
    notes?: Record<string, string>
  }): Promise<OrderResponse> {
    try {
      console.log('[Razorpay] Creating order:', params)
      
      const order = await this.instance.orders.create({
        amount: params.amount,
        currency: params.currency || 'INR',
        receipt: params.receipt || `receipt_${Date.now()}`,
        notes: params.notes || {},
      })

      console.log('[Razorpay] Order created:', order.id)
      return order
    } catch (error: any) {
      console.error('[Razorpay] Order creation failed:', error)
      throw new Error(`Razorpay order creation failed: ${error.error?.description || error.message}`)
    }
  }

  // Fetch order details
  async fetchOrder(orderId: string): Promise<OrderResponse> {
    try {
      const order = await this.instance.orders.fetch(orderId)
      return order
    } catch (error: any) {
      console.error('[Razorpay] Fetch order failed:', error)
      throw new Error(`Failed to fetch order: ${error.message}`)
    }
  }

  // Fetch payment details
  async fetchPayment(paymentId: string): Promise<PaymentResponse> {
    try {
      const payment = await this.instance.payments.fetch(paymentId)
      return payment
    } catch (error: any) {
      console.error('[Razorpay] Fetch payment failed:', error)
      throw new Error(`Failed to fetch payment: ${error.message}`)
    }
  }

  // Capture payment (for authorized payments)
  async capturePayment(paymentId: string, amount: number, currency: string = 'INR'): Promise<PaymentResponse> {
    try {
      const payment = await this.instance.payments.capture(paymentId, amount, currency)
      console.log('[Razorpay] Payment captured:', paymentId)
      return payment
    } catch (error: any) {
      console.error('[Razorpay] Capture failed:', error)
      throw new Error(`Payment capture failed: ${error.message}`)
    }
  }

  // Verify payment signature (for security)
  verifyPaymentSignature(params: {
    orderId: string
    paymentId: string
    signature: string
  }): boolean {
    try {
      const crypto = require('crypto')
      const text = `${params.orderId}|${params.paymentId}`
      const secret = this.instance.key_secret
      
      const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(text)
        .digest('hex')

      const isValid = generated_signature === params.signature
      
      if (isValid) {
        console.log('[Razorpay] ✅ Signature verified')
      } else {
        console.error('[Razorpay] ❌ Invalid signature')
      }
      
      return isValid
    } catch (error) {
      console.error('[Razorpay] Signature verification error:', error)
      return false
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    try {
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex')

      return expectedSignature === signature
    } catch (error) {
      console.error('[Razorpay] Webhook signature verification error:', error)
      return false
    }
  }

  // Create refund
  async createRefund(paymentId: string, amount?: number): Promise<any> {
    try {
      const refundData: any = { payment_id: paymentId }
      if (amount) {
        refundData.amount = amount
      }
      
      const refund = await this.instance.payments.refund(paymentId, refundData)
      console.log('[Razorpay] Refund created:', refund.id)
      return refund
    } catch (error: any) {
      console.error('[Razorpay] Refund failed:', error)
      throw new Error(`Refund failed: ${error.message}`)
    }
  }
}

// Export singleton instance
let razorpayInstance: RazorpayService | null = null

export function getRazorpayService(): RazorpayService {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    
    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured')
    }

    razorpayInstance = new RazorpayService({
      keyId,
      keySecret,
    })
  }

  return razorpayInstance
}

export default RazorpayService
