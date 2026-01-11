"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { RefreshCw, MessageCircle, Bot, AlertCircle, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

interface ChatLog {
  id: string
  question: string
  answer: string
  source: "knowledge_base" | "ai" | "fallback"
  provider?: string
  model?: string
  created_at: string
}

interface ChatStats {
  total: number
  knowledge_base: number
  ai: number
  fallback: number
}

export default function ChatLogsPage() {
  const [logs, setLogs] = useState<ChatLog[]>([])
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("limit", "100")
      if (filter) params.append("source", filter)

      const response = await fetch(`/api/admin/chat-logs?${params}`)
      const result = await response.json()
      
      if (result.data) {
        setLogs(result.data)
      }
      if (result.stats) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error("Error fetching chat logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filter])

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "knowledge_base":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
            <TrendingUp className="w-3 h-3" />
            Knowledge Base
          </span>
        )
      case "ai":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            <Bot className="w-3 h-3" />
            AI Generated
          </span>
        )
      case "fallback":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
            <AlertCircle className="w-3 h-3" />
            Fallback
          </span>
        )
      default:
        return null
    }
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Chat Logs</h1>
            <p className="text-neutral-600 mt-1">
              Monitor customer support conversations
            </p>
          </div>
          <Button
            onClick={fetchLogs}
            variant="outline"
            className="border-neutral-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Total Chats</p>
                  <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.total || 0}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-neutral-400" />
              </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">From Cache</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {stats.knowledge_base || 0}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {stats.total > 0 
                      ? `${Math.round((stats.knowledge_base / stats.total) * 100)}%`
                      : "0%"}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">AI Generated</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{stats.ai || 0}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {stats.total > 0 
                      ? `${Math.round((stats.ai / stats.total) * 100)}%`
                      : "0%"}
                  </p>
                </div>
                <Bot className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Fallbacks</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.fallback || 0}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {stats.total > 0 
                      ? `${Math.round((stats.fallback / stats.total) * 100)}%`
                      : "0%"}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setFilter(null)}
            variant={filter === null ? "default" : "outline"}
            size="sm"
          >
            All
          </Button>
          <Button
            onClick={() => setFilter("knowledge_base")}
            variant={filter === "knowledge_base" ? "default" : "outline"}
            size="sm"
          >
            Knowledge Base
          </Button>
          <Button
            onClick={() => setFilter("ai")}
            variant={filter === "ai" ? "default" : "outline"}
            size="sm"
          >
            AI Generated
          </Button>
          <Button
            onClick={() => setFilter("fallback")}
            variant={filter === "fallback" ? "default" : "outline"}
            size="sm"
          >
            Fallback
          </Button>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg">
            <MessageCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600">No chat logs yet.</p>
            <p className="text-sm text-neutral-500 mt-2">
              Logs will appear here when customers use the chatbot.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <motion.div
                key={log.id}
                className="bg-white border border-neutral-200 rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {getSourceBadge(log.source)}
                      {log.provider && log.provider !== "knowledge_base" && (
                        <span className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded">
                          Provider: {log.provider}
                        </span>
                      )}
                      {log.model && (
                        <span className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded">
                          Model: {log.model}
                        </span>
                      )}
                      <span className="text-xs text-neutral-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-neutral-700 mb-1">
                          Customer Question:
                        </p>
                        <p className="text-neutral-900">{log.question}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-700 mb-1">
                          AI Response:
                        </p>
                        <p className="text-neutral-600 whitespace-pre-wrap">{log.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
