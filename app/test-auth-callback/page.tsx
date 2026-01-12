"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase-client"

/**
 * Test page to debug auth callback handling
 * Navigate to this with a hash to test: /test-auth-callback#access_token=xxx&type=magiclink
 */
export default function TestAuthCallbackPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [urlInfo, setUrlInfo] = useState({
    href: "",
    hash: "",
    search: "",
  })

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    setUrlInfo({
      href: window.location.href,
      hash: window.location.hash,
      search: window.location.search,
    })

    addLog("Page loaded")
    addLog(`URL: ${window.location.href}`)
    addLog(`Hash: ${window.location.hash}`)
    addLog(`Search: ${window.location.search}`)

    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get("access_token")
    const type = hashParams.get("type")

    addLog(`Token found in hash: ${!!accessToken}`)
    addLog(`Type: ${type}`)

    if (accessToken) {
      addLog("Attempting to set session...")
      const supabase = getSupabaseBrowser()
      
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get("refresh_token") || "",
      }).then(({ data, error }) => {
        if (error) {
          addLog(`❌ Session error: ${error.message}`)
        } else {
          addLog(`✅ Session set successfully!`)
          addLog(`User ID: ${data.user?.id}`)
          addLog(`Email: ${data.user?.email}`)
        }
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Auth Callback Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">URL Information</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <strong>Full URL:</strong>
              <div className="bg-gray-100 p-2 rounded mt-1 break-all">{urlInfo.href || "Loading..."}</div>
            </div>
            <div>
              <strong>Hash Fragment:</strong>
              <div className="bg-gray-100 p-2 rounded mt-1 break-all">{urlInfo.hash || "(empty)"}</div>
            </div>
            <div>
              <strong>Query String:</strong>
              <div className="bg-gray-100 p-2 rounded mt-1 break-all">{urlInfo.search || "(empty)"}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
            {logs.length === 0 && <div className="text-gray-500">No logs yet...</div>}
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">💡 How to test:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Request a magic link or password reset email</li>
            <li>Copy the URL from the email</li>
            <li>Replace the domain with: <code className="bg-white px-2 py-1 rounded">http://localhost:3000/test-auth-callback</code></li>
            <li>Keep the hash fragment (everything after #)</li>
            <li>Paste in browser and check the logs above</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
