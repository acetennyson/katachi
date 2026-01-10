"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { Send, Plus } from "lucide-react"

export default function MessagesPage() {
  const [selectedThread, setSelectedThread] = useState<string | null>("1")
  const [messageText, setMessageText] = useState("")

  const threads = [
    {
      id: "1",
      subject: "Order ORD-001 Question",
      lastMessage: "When will my order arrive?",
      date: "2024-01-20",
      unread: 0,
      status: "open" as const,
    },
    {
      id: "2",
      subject: "Product Size Inquiry",
      lastMessage: "Do you have size M available?",
      date: "2024-01-19",
      unread: 1,
      status: "pending" as const,
    },
  ]

  const messages = [
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

  const handleSend = () => {
    if (messageText.trim()) {
      console.log("Message sent:", messageText)
      setMessageText("")
    }
  }

  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-32 pb-20">
        <div className="container-custom">
          <Reveal>
            <div className="flex justify-between items-center mb-12">
              <h1 className="text-5xl md:text-6xl font-bold text-neutral-900">Messages</h1>
              <Button className="bg-neutral-900 text-white hover:bg-neutral-800 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Message
              </Button>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Thread List */}
            <Reveal delay={0.1}>
              <motion.div className="lg:col-span-1">
                <div className="space-y-2">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread.id)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedThread === thread.id
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{thread.subject}</h3>
                        {thread.unread > 0 && (
                          <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {thread.unread}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm truncate ${selectedThread === thread.id ? "text-white/80" : "text-neutral-600"}`}
                      >
                        {thread.lastMessage}
                      </p>
                      <p
                        className={`text-xs mt-2 ${selectedThread === thread.id ? "text-white/60" : "text-neutral-500"}`}
                      >
                        {thread.date}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            </Reveal>

            {/* Chat Area */}
            <Reveal delay={0.2}>
              <motion.div className="lg:col-span-2 border border-neutral-200 rounded-lg flex flex-col bg-white overflow-hidden">
                {selectedThread ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-6 border-b border-neutral-200">
                      <h2 className="text-xl font-bold text-neutral-900">
                        {threads.find((t) => t.id === selectedThread)?.subject}
                      </h2>
                      <p className="text-sm text-neutral-600 mt-1">
                        Status:{" "}
                        <span className="font-semibold capitalize">
                          {threads.find((t) => t.id === selectedThread)?.status}
                        </span>
                      </p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              message.isUser ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-900"
                            }`}
                          >
                            <p className="font-semibold text-sm mb-1">{message.sender}</p>
                            <p className="text-sm">{message.text}</p>
                            <p className={`text-xs mt-1 ${message.isUser ? "text-white/60" : "text-neutral-600"}`}>
                              {message.timestamp}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="p-6 border-t border-neutral-200">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSend()}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                        />
                        <Button onClick={handleSend} className="bg-neutral-900 text-white hover:bg-neutral-800 px-6">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-96 text-neutral-600">
                    <p>Select a conversation to start messaging</p>
                  </div>
                )}
              </motion.div>
            </Reveal>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
