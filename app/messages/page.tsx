"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { Send, Plus, Bot, ArrowRight } from "lucide-react"

interface Message {
  id: string
  sender: string
  text: string
  timestamp: string
  isUser: boolean
  source?: string
}

export default function MessagesPage() {
  const router = useRouter()
  const [messageText, setMessageText] = useState("")
  const [aiMessages, setAiMessages] = useState<Message[]>([
    {
      id: "ai-welcome",
      sender: "AI Assistant",
      text: "Hi! I'm your AI assistant. How can I help you today?",
      timestamp: new Date().toLocaleString(),
      isUser: false,
    },
  ])
  const [isAiLoading, setIsAiLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const threads = [
    {
      id: "ai",
      subject: "AI Assistant",
      lastMessage: "Ask me anything!",
      date: "Always available",
      unread: 0,
      status: "active" as const,
      isAI: true,
    },
    {
      id: "1",
      subject: "Order ORD-001 Question",
      lastMessage: "When will my order arrive?",
      date: "2024-01-20",
      unread: 0,
      status: "open" as const,
      isAI: false,
    },
    {
      id: "2",
      subject: "Product Size Inquiry",
      lastMessage: "Do you have size M available?",
      date: "2024-01-19",
      unread: 1,
      status: "pending" as const,
      isAI: false,
    },
  ]

  const regularMessages = [
    {
      id: "1",
      sender: "Support Team",
      text: "Hello! Your order is being processed and should ship within 2-3 business days.",
      timestamp: "2024-01-20 14:30",
      isUser: false,
    },
    {
      id: "2",
      sender: "You",
      text: "Thank you! Can you confirm the tracking number?",
      timestamp: "2024-01-20 15:00",
      isUser: true,
    },
    {
      id: "3",
      sender: "Support Team",
      text: "Of course! Your tracking number is DHL-123456789. You'll receive an email with the tracking link shortly.",
      timestamp: "2024-01-20 15:30",
      isUser: false,
    },
  ]

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [aiMessages])

  const handleSendToAI = async () => {
    if (!messageText.trim() || isAiLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "You",
      text: messageText.trim(),
      timestamp: new Date().toLocaleString(),
      isUser: true,
    }

    setAiMessages((prev) => [...prev, userMessage])
    setMessageText("")
    setIsAiLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          conversationHistory: aiMessages.slice(1),
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "AI Assistant",
        text: data.response,
        timestamp: new Date().toLocaleString(),
        isUser: false,
        source: data.source,
      }

      setAiMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("AI Chat Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "AI Assistant",
        text: "I'm having trouble connecting right now. Please try again or contact support@katachi.com",
        timestamp: new Date().toLocaleString(),
        isUser: false,
      }
      setAiMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsAiLoading(false)
    }
  }

  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-32 pb-20">
        <div className="container-custom">
          <Reveal>
            <div className="mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-4">Messages</h1>
              <p className="text-neutral-600">Select a conversation to continue</p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {threads.map((thread) => (
                <motion.button
                  key={thread.id}
                  onClick={() => router.push(`/messages/${thread.id}`)}
                  className="bg-white rounded-lg p-6 border border-neutral-200 hover:border-neutral-900 hover:shadow-lg transition-all text-left"
                  whileHover={{ y: -4 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {thread.isAI && (
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Bot className="w-5 h-5 text-purple-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-neutral-900">{thread.subject}</h3>
                        <p className="text-xs text-neutral-500">{thread.date}</p>
                      </div>
                    </div>
                    {thread.unread > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {thread.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 line-clamp-2 mb-4">{thread.lastMessage}</p>
                  <div className="flex items-center text-neutral-900 text-sm font-medium">
                    Open conversation
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </motion.button>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
      <Footer />
    </main>
  )
}
