"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Send, ArrowLeft, Bot } from "lucide-react"

interface Message {
  id: string
  sender: string
  text: string
  timestamp: string
  isUser: boolean
  source?: string
}

interface Conversation {
  id: string
  subject: string
  with: string
  status: string
  isAI: boolean
}

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.conversationId as string
  
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversation()
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversation = async () => {
    // Check if this is AI conversation
    if (conversationId === "ai") {
      setConversation({
        id: "ai",
        subject: "AI Assistant",
        with: "AI Bot",
        status: "active",
        isAI: true,
      })
      setMessages([
        {
          id: "ai-welcome",
          sender: "AI Assistant",
          text: "Hi! I'm your AI assistant. How can I help you today?",
          timestamp: new Date().toLocaleString(),
          isUser: false,
        },
      ])
    } else {
      // Load admin conversation from API
      try {
        const response = await fetch(`/api/messages/${conversationId}`)
        const data = await response.json()
        
        if (data.conversation) {
          setConversation(data.conversation)
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error("Error loading conversation:", error)
      }
    }
  }

  const handleSendToAI = async () => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "You",
      text: messageText.trim(),
      timestamp: new Date().toLocaleString(),
      isUser: true,
    }

    setMessages((prev) => [...prev, userMessage])
    setMessageText("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          conversationHistory: messages.slice(1),
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

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("AI Chat Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "AI Assistant",
        text: "I'm having trouble connecting right now. Please try again or contact support@katachi.com",
        timestamp: new Date().toLocaleString(),
        isUser: false,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendToAdmin = async () => {
    if (!messageText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "You",
      text: messageText.trim(),
      timestamp: new Date().toLocaleString(),
      isUser: true,
    }

    setMessages((prev) => [...prev, userMessage])
    setMessageText("")

    try {
      await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      })
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const handleSend = () => {
    if (conversation?.isAI) {
      handleSendToAI()
    } else {
      handleSendToAdmin()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!conversation) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 bg-neutral-50 pt-24 pb-12">
        <div className="container-custom max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <Button
              onClick={() => router.push("/messages")}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Messages
            </Button>
            
            <div className="flex items-center gap-3">
              {conversation.isAI && (
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-purple-600" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">{conversation.subject}</h1>
                <p className="text-neutral-600">
                  {conversation.isAI ? "AI-Powered Support" : `Conversation with ${conversation.with}`}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            {/* Messages Area */}
            <div className="h-[600px] overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.isUser
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-900"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs opacity-70">{message.timestamp}</p>
                      {message.source === "knowledge_base" && (
                        <span className="text-xs opacity-70">⚡ Instant</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* AI Loading */}
              {isLoading && conversation.isAI && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-neutral-100 text-neutral-900 max-w-xs px-4 py-2 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-neutral-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={conversation.isAI ? "Ask me anything..." : "Type your message..."}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 disabled:opacity-50"
                />
                <Button
                  onClick={handleSend}
                  disabled={!messageText.trim() || isLoading}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white px-6"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              {conversation.isAI && (
                <p className="text-xs text-neutral-500 mt-2 text-center">
                  Powered by free open-source AI
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
