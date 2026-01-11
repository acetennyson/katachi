"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Search, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"

interface KnowledgeBaseEntry {
  id: string
  question: string
  answer: string
  use_count: number
  created_at: string
  last_used_at: string
}

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeBaseEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingEntry, setEditingEntry] = useState<KnowledgeBaseEntry | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formData, setFormData] = useState({ question: "", answer: "" })

  // Fetch knowledge base entries
  const fetchEntries = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      params.append("sortBy", "use_count")
      params.append("order", "desc")

      const response = await fetch(`/api/admin/knowledge-base?${params}`)
      const result = await response.json()
      
      if (result.data) {
        setEntries(result.data)
      }
    } catch (error) {
      console.error("Error fetching knowledge base:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
  }, [search])

  // Create entry
  const handleCreate = async () => {
    if (!formData.question || !formData.answer) return

    try {
      const response = await fetch("/api/admin/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({ question: "", answer: "" })
        setIsAddModalOpen(false)
        fetchEntries()
      }
    } catch (error) {
      console.error("Error creating entry:", error)
    }
  }

  // Update entry
  const handleUpdate = async () => {
    if (!editingEntry) return

    try {
      const response = await fetch(`/api/admin/knowledge-base/${editingEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: editingEntry.question,
          answer: editingEntry.answer,
        }),
      })

      if (response.ok) {
        setEditingEntry(null)
        fetchEntries()
      }
    } catch (error) {
      console.error("Error updating entry:", error)
    }
  }

  // Delete entry
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return

    try {
      const response = await fetch(`/api/admin/knowledge-base/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchEntries()
      }
    } catch (error) {
      console.error("Error deleting entry:", error)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">AI Knowledge Base</h1>
            <p className="text-neutral-600 mt-1">
              Manage pre-defined answers for customer support
            </p>
          </div>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-neutral-900 hover:bg-neutral-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {/* Search & Refresh */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search questions or answers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
            />
          </div>
          <Button
            onClick={fetchEntries}
            variant="outline"
            className="border-neutral-200"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg">
            <p className="text-neutral-600">No knowledge base entries yet.</p>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4"
              variant="outline"
            >
              Add Your First Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                className="bg-white border border-neutral-200 rounded-lg p-6"
                whileHover={{ scale: 1.01 }}
              >
                {editingEntry?.id === entry.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        Question
                      </label>
                      <input
                        type="text"
                        value={editingEntry.question}
                        onChange={(e) =>
                          setEditingEntry({ ...editingEntry, question: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        Answer
                      </label>
                      <textarea
                        value={editingEntry.answer}
                        onChange={(e) =>
                          setEditingEntry({ ...editingEntry, answer: e.target.value })
                        }
                        rows={4}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleUpdate}
                        className="bg-neutral-900 hover:bg-neutral-800 text-white"
                      >
                        Save
                      </Button>
                      <Button onClick={() => setEditingEntry(null)} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                          {entry.question}
                        </h3>
                        <p className="text-neutral-600 whitespace-pre-wrap">{entry.answer}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => setEditingEntry(entry)}
                          variant="outline"
                          size="sm"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(entry.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:border-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                      <span>Used {entry.use_count} times</span>
                      <span>•</span>
                      <span>Created {new Date(entry.created_at).toLocaleDateString()}</span>
                      {entry.last_used_at && (
                        <>
                          <span>•</span>
                          <span>
                            Last used {new Date(entry.last_used_at).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-neutral-900 mb-4">
                Add Knowledge Base Entry
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Question
                  </label>
                  <input
                    type="text"
                    placeholder="What question will customers ask?"
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Answer
                  </label>
                  <textarea
                    placeholder="Your pre-defined answer..."
                    value={formData.answer}
                    onChange={(e) =>
                      setFormData({ ...formData, answer: e.target.value })
                    }
                    rows={6}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={handleCreate}
                  disabled={!formData.question || !formData.answer}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white"
                >
                  Create Entry
                </Button>
                <Button onClick={() => setIsAddModalOpen(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
