/**
 * AI Customer Support Service
 * 
 * Uses open-source LLMs for free, intelligent customer support
 * 
 * Options:
 * 1. Development: Ollama (run locally) - Free, fast, no limits
 * 2. Production: Hugging Face Inference API - Free tier available
 * 
 * Features:
 * - Answers customer questions about products, orders, shipping
 * - Learns from interactions (stores Q&A in knowledge base)
 * - Contextually aware of your business (products, policies)
 * - Completely free to use
 */

import settings from "@/lib/constants/settings"

// Types
export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface ChatResponse {
  response: string
  confidence?: number
  source?: "knowledge_base" | "ai" | "fallback"
}

/**
 * AI Service Class
 * Handles communication with LLM (Ollama or Hugging Face)
 */
class AIService {
  private apiUrl: string
  private model: string
  private useOllama: boolean

  constructor() {
    // Use Ollama for development, Hugging Face for production
    this.useOllama = false // process.env.NODE_ENV === "development" || process.env.USE_OLLAMA === "true"
    
    if (this.useOllama) {
      // Ollama (local)
      this.apiUrl = process.env.OLLAMA_API_URL || "http://localhost:11434"
      this.model = process.env.OLLAMA_MODEL || "llama3.2" // Fast, good quality
    } else {
      // Hugging Face Router (OpenAI-compatible)
      this.apiUrl = "https://router.huggingface.co/v1"
      this.model = process.env.HF_MODEL || "meta-llama/Llama-3.2-3B-Instruct"
    }
  }

  /**
   * Generate a response from the LLM
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      if (this.useOllama) {
        return await this.chatWithOllama(messages)
      } else {
        return await this.chatWithHuggingFace(messages)
      }
    } catch (error) {
      console.error("[AI Service] Error:", error)
      throw error
    }
  }

  /**
   * Chat with Ollama (local development)
   */
  private async chatWithOllama(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(`${this.apiUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.message.content
  }

  /**
   * Chat with Hugging Face Router (OpenAI-compatible format)
   */
  private async chatWithHuggingFace(messages: ChatMessage[]): Promise<string> {
    const apiKey = process.env.HUGGINGFACE_API_KEY
    
    if (!apiKey) {
      throw new Error("HUGGINGFACE_API_KEY not set")
    }

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.95,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Hugging Face API error: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    
    // OpenAI-compatible response format
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content
    }
    
    throw new Error("Unexpected response format from Hugging Face")
  }

  /**
   * Format messages for Hugging Face (single prompt string)
   */
  private formatMessagesForHF(messages: ChatMessage[]): string {
    return messages
      .map((msg) => {
        if (msg.role === "system") {
          return `[INST] ${msg.content} [/INST]`
        } else if (msg.role === "user") {
          return `[INST] ${msg.content} [/INST]`
        } else {
          return msg.content
        }
      })
      .join("\n")
  }

  /**
   * Get system prompt with business context
   */
  getSystemPrompt(): string {
    return `You are a helpful customer support assistant for Katachi Furniture, a modern furniture e-commerce store.

Your role:
- Answer questions about products, orders, shipping, and returns
- Be friendly, professional, and concise
- Provide specific, actionable information
- Keep responses under 100 words unless more detail is needed

=== STORE INFORMATION ===

Store Name: Katachi Online Store
Website: katachi.com (or the domain where this is deployed)
Type: Modern furniture e-commerce store

Product Categories:
- Sofas & Loveseats (modern, minimalist designs)
- Chairs & Armchairs (lounge chairs, dining chairs)
- Tables (dining tables, coffee tables)
- Shelving & Storage (modular shelving units)

All products feature:
- Contemporary minimalist design
- High-quality materials (oak, walnut, bouclé, velvet)
- Detailed product pages with images, descriptions, and specifications
- Real-time inventory status

=== PLATFORM FEATURES ===

Technology Stack:
- Built with Next.js (React framework)
- PostgreSQL database via Supabase
- Modern, responsive design
- Real-time inventory management

Shopping Features:
- Browse products by category
- Product search and filtering
- Shopping cart functionality
- Guest checkout or account creation
- Order tracking
- Save multiple shipping addresses
- Save payment methods for faster checkout

Account Features:
- Create account with email/password
- View order history
- Track current orders
- Manage shipping addresses
- View saved payment cards
- Update account information

=== PAYMENT & SHIPPING ===

Payment Methods: ${this.getPaymentMethods()}
- Secure payment processing via Stripe
- Save payment methods for future purchases
- Bank transfer option available
- PayPal integration (if enabled)

Shipping:
- Multiple shipping methods available
- Worldwide shipping (times vary by location)
- Shipping costs calculated at checkout
- Order tracking provided after shipment
- Estimated delivery times shown during checkout

Tax & Pricing:
- Prices shown in USD (or configured currency)
- Sales tax calculated based on shipping address
- Final total shown before payment

=== POLICIES ===

Returns & Refunds:
- 30-day return policy on most items
- Items must be in original condition
- Contact support to initiate a return
- Refund processed after item is received and inspected

Order Issues:
- Contact support for order modifications
- Cancel orders before shipment
- Track orders in your account dashboard

Privacy & Security:
- Secure payment processing
- Data stored securely
- Privacy policy available on website

=== CONTACT & SUPPORT ===

For additional help, customers can:
1. Use this AI chat assistant (that's you!)
2. Check their account dashboard for order status
3. Browse the product catalog at /catalog
4. View their cart at /cart
5. Manage their profile at /profile

For complex issues beyond your knowledge:
- Suggest checking their account dashboard
- Recommend browsing the help section
- For urgent matters, acknowledge you'll escalate to human support

Technical questions about orders, payments, or account issues should be directed to human support.

=== YOUR GUIDELINES ===

DO:
✓ Provide clear, direct answers
✓ Guide users to relevant pages (cart, catalog, profile, checkout)
✓ Explain features and how to use them
✓ Be friendly and professional
✓ Admit when you don't know something

DON'T:
✗ Make up product prices or details
✗ Make up order information
✗ Provide fake contact info (emails/phones)
✗ Make promises about specific delivery dates without order context
✗ Share internal technical details (database, API keys, etc.)

When users ask "how do I contact support" or similar:
- Acknowledge their request
- Let them know you're here to help via this chat
- For account-specific issues, guide them to their account dashboard
- For complex issues, confirm you'll make sure a human team member can review their request

Remember: You're knowledgeable about the platform, its features, and how customers can use it. Be helpful and specific!`
  }

  /**
   * Get enabled payment methods from settings
   */
  private getPaymentMethods(): string {
    const methods = []
    if (settings.payment.card) methods.push("Credit/Debit Card (Stripe)")
    else methods.push("Credit/Debit Card (Manual)")
    if (settings.payment.paypal) methods.push("PayPal")
    if (settings.payment.bank_transfer) methods.push("Bank Transfer")
    return methods.join(", ")
  }
}

// Export singleton instance
export const aiService = new AIService()
