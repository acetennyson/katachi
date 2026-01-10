"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminLayout } from "@/components/admin/admin-layout"
import { motion } from "framer-motion"
import { Reveal } from "@/components/reveal"
import { Button } from "@/components/ui/button"
import { MessageSquare, AlertCircle } from "lucide-react"

export default function AdminMessaging() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/signin?redirect=/admin/messaging")
      } else if (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SUPPORT") {
        router.push("/profile")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-900 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SUPPORT")) {
    return null
  }
  const [selectedThread, setSelectedThread] = useState<string | null>("1")
  const [filter, setFilter] = useState("all")

  const threads = [
    {
      id: "1",
      userId: "user-123",
      userName: "John Doe",
      subject: "Order delivery issue",
      messageCount: 3,
      status: "open",
      createdAt: "2024-01-20",
      priority: "high",
    },
    {
      id: "2",
      userId: "user-456",
      userName: "Jane Smith",
      subject: "Size availability",
      messageCount: 2,
      status: "pending",
      createdAt: "2024-01-19",
      priority: "normal",
    },
    {
      id: "3",
      userId: "user-789",
      userName: "Bob Wilson",
      subject: "Return request",
      messageCount: 5,
      status: "closed",
      createdAt: "2024-01-18",
      priority: "high",
    },
  ]

  const filteredThreads = threads.filter((t) => {
    if (filter === "open") return t.status === "open"
    if (filter === "pending") return t.status === "pending"
    if (filter === "high") return t.priority === "high"
    return true
  })

  return (
    <AdminLayout>
      <div className="container-custom max-w-7xl">
          <Reveal>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-neutral-900">Support Messaging</h1>
            <p className="text-lg text-neutral-600 mb-12">Manage customer support conversations</p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters & Stats */}
            <Reveal delay={0.1}>
              <motion.div className="space-y-6">
                {/* Stats */}
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-600 mb-2">Open Threads</p>
                  <p className="text-3xl font-bold text-neutral-900">
                    {threads.filter((t) => t.status === "open").length}
                  </p>
                </div>

                {/* Filter */}
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-3">Filter</h3>
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "All" },
                      { value: "open", label: "Open" },
                      { value: "pending", label: "Pending" },
                      { value: "high", label: "High Priority" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilter(option.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                          filter === option.value
                            ? "bg-neutral-900 text-white"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Reveal>

            {/* Thread List & Chat */}
            <Reveal delay={0.2}>
              <motion.div className="lg:col-span-3">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Thread List */}
                  <div className="lg:col-span-2 space-y-2">
                    {filteredThreads.map((thread) => (
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
                          <h4 className="font-semibold truncate">{thread.userName}</h4>
                          {thread.priority === "high" && (
                            <AlertCircle
                              className={`w-4 h-4 flex-shrink-0 ${
                                selectedThread === thread.id ? "text-orange-300" : "text-orange-500"
                              }`}
                            />
                          )}
                        </div>
                        <p
                          className={`text-sm truncate mb-2 ${
                            selectedThread === thread.id ? "text-white/80" : "text-neutral-600"
                          }`}
                        >
                          {thread.subject}
                        </p>
                        <div className="flex justify-between text-xs">
                          <span className={selectedThread === thread.id ? "text-white/60" : "text-neutral-500"}>
                            {thread.messageCount} messages
                          </span>
                          <span
                            className={`px-2 py-1 rounded ${
                              thread.status === "open"
                                ? "bg-green-100 text-green-800"
                                : thread.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {thread.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Chat View */}
                  <div className="lg:col-span-3 border border-neutral-200 rounded-lg flex flex-col bg-white">
                    {selectedThread ? (
                      <>
                        <div className="p-4 border-b border-neutral-200">
                          <h3 className="font-bold text-neutral-900">
                            {threads.find((t) => t.id === selectedThread)?.subject}
                          </h3>
                          <p className="text-sm text-neutral-600">
                            {threads.find((t) => t.id === selectedThread)?.userName}
                          </p>
                        </div>
                        <div className="flex-1 p-4 bg-neutral-50 flex items-center justify-center min-h-64">
                          <p className="text-neutral-600 text-sm">Messages will load here</p>
                        </div>
                        <div className="p-4 border-t border-neutral-200">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Type response..."
                              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none"
                            />
                            <Button className="bg-neutral-900 text-white hover:bg-neutral-800 text-sm px-4">
                              Reply
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-neutral-600">
                        <MessageSquare className="w-6 h-6 mr-2" />
                        <p>Select a thread to reply</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </Reveal>
          </div>
        </div>
    </AdminLayout>
  )
}
