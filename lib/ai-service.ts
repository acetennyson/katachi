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
    this.useOllama = process.env.NODE_ENV === "development" || process.env.USE_OLLAMA === "true"
    
    if (this.useOllama) {
      // Ollama (local)
      this.apiUrl = process.env.OLLAMA_API_URL || "http://localhost:11434"
      this.model = process.env.OLLAMA_MODEL || "llama3.2" // Fast, good quality
    } else {
      // Hugging Face Inference API
      this.apiUrl = "https://api-inference.huggingface.co/models"
      this.model = process.env.HF_MODEL || "mistralai/Mistral-7B-Instruct-v0.2"
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
   * Chat with Hugging Face (production)
   */
  private async chatWithHuggingFace(messages: ChatMessage[]): Promise<string> {
    const apiKey = process.env.HUGGINGFACE_API_KEY
    
    if (!apiKey) {
      throw new Error("HUGGINGFACE_API_KEY not set")
    }

    // Format messages into a single prompt
    const prompt = this.formatMessagesForHF(messages)

    const response = await fetch(`${this.apiUrl}/${this.model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    // Handle different response formats
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text
    } else if (data.generated_text) {
      return data.generated_text
    } else if (typeof data === "string") {
      return data
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
- If you don't know something, admit it and suggest contacting human support
- Keep responses under 100 words unless more detail is needed

Store Information:
- Store Name: Katachi Furniture
- Products: Modern furniture (sofas, chairs, tables, shelving)
- Shipping: Available worldwide, times vary by location
- Returns: 30-day return policy on most items
- Payment Methods: ${this.getPaymentMethods()}

Important:
- Never make up product details or prices
- Always verify order information before providing details
- Escalate complex issues to human support`
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
