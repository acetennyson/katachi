"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SuperAdminGuard } from "@/components/admin/superadmin-guard"
import { AdminLayout } from "@/components/admin/admin-layout"
import { BreadcrumbNav } from "@/components/admin/breadcrumb-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Settings2, Link2, TestTube, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    defaults: {
      taxPercentage: "19.00",
      shippingPrice: "0.00",
      currency: "USD",
    },
    display: {
      currencyLocale: "en-US",
      currencySymbol: "$",
    },
  })

  const [atlassian, setAtlassian] = useState({
    atlassian_support_enabled: false,
    atlassian_site_url: "",
    atlassian_email: "",
    atlassian_api_token: "",
    atlassian_confluence_space_keys: "", // comma-separated
    atlassian_jira_project_keys: "", // comma-separated
  })

  const [testingAtlassian, setTestingAtlassian] = useState(false)

  const [aiProviders, setAiProviders] = useState({
    ai_provider_order: "huggingface,groq,gemini,together,openai",
    ai_provider_enabled: {
      huggingface: true,
      groq: false,
      gemini: false,
      together: false,
      openai: false,
    } as Record<string, boolean>,
    huggingface_api_key: "",
    huggingface_model: "meta-llama/Llama-3.2-3B-Instruct",
    groq_api_key: "",
    groq_model: "llama-3.1-8b-instant",
    gemini_api_key: "",
    gemini_model: "gemini-1.5-flash",
    together_api_key: "",
    together_model: "meta-llama/Llama-3.1-8B-Instruct-Turbo",
    openai_api_key: "",
    openai_model: "gpt-4o-mini",
  })
  const [testingProviders, setTestingProviders] = useState(false)
  
  // Track original state to detect changes
  const [originalFormData, setOriginalFormData] = useState(formData)
  const [originalAtlassian, setOriginalAtlassian] = useState(atlassian)
  const [originalAiProviders, setOriginalAiProviders] = useState(aiProviders)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  // Detect changes
  useEffect(() => {
    const formChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData)
    const atlassianChanged = JSON.stringify(atlassian) !== JSON.stringify(originalAtlassian)
    const aiChanged = JSON.stringify(aiProviders) !== JSON.stringify(originalAiProviders)
    
    setHasChanges(formChanged || atlassianChanged || aiChanged)
  }, [formData, atlassian, aiProviders, originalFormData, originalAtlassian, originalAiProviders])

  const fetchSettings = async () => {
    try {
      const [settingsRes, atlassianRes, aiRes] = await Promise.all([
        fetch("/api/admin/settings", { cache: 'no-store' }),
        fetch("/api/admin/atlassian", { cache: 'no-store' }),
        fetch("/api/admin/ai-providers", { cache: 'no-store' }),
      ])

      const data = await settingsRes.json()
      const atlassianData = await atlassianRes.json()
      const aiData = await aiRes.json()

      if (data.success) {
        const newFormData = {
          defaults: {
            taxPercentage: data.settings.defaults.taxPercentage.toString(),
            shippingPrice: data.settings.defaults.shippingPrice.toString(),
            currency: data.settings.defaults.currency,
          },
          display: {
            currencyLocale: data.settings.display.currencyLocale,
            currencySymbol: data.settings.display.currencySymbol,
          },
        }
        setFormData(newFormData)
        setOriginalFormData(newFormData)
      }

      if (atlassianData.success) {
        const newAtlassian = {
          atlassian_support_enabled: !!atlassianData.settings.atlassian_support_enabled,
          atlassian_site_url: atlassianData.settings.atlassian_site_url || "",
          atlassian_email: atlassianData.settings.atlassian_email || "",
          atlassian_api_token: atlassianData.settings.atlassian_api_token || "",
          atlassian_confluence_space_keys: (atlassianData.settings.atlassian_confluence_space_keys || []).join(","),
          atlassian_jira_project_keys: (atlassianData.settings.atlassian_jira_project_keys || []).join(","),
        }
        setAtlassian(newAtlassian)
        setOriginalAtlassian(newAtlassian)
      }

      if (aiData.success) {
        console.log('[Settings] AI Data received:', JSON.stringify(aiData.settings, null, 2))
        console.log('[Settings] ai_provider_enabled from API:', aiData.settings.ai_provider_enabled)
        setAiProviders((prev) => {
          const newState = {
            ...prev,
            ...aiData.settings,
            ai_provider_order: (aiData.settings.ai_provider_order || []).join(","),
            ai_provider_enabled: aiData.settings.ai_provider_enabled || prev.ai_provider_enabled,
          }
          console.log('[Settings] New aiProviders state:', JSON.stringify(newState, null, 2))
          setOriginalAiProviders(newState)
          return newState
        })
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const [settingsRes, atlassianRes, aiRes] = await Promise.all([
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            defaults: {
              taxPercentage: parseFloat(formData.defaults.taxPercentage),
              shippingPrice: parseFloat(formData.defaults.shippingPrice),
              currency: formData.defaults.currency,
            },
            display: {
              currencyLocale: formData.display.currencyLocale,
              currencySymbol: formData.display.currencySymbol,
            },
          }),
        }),
        fetch("/api/admin/atlassian", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            atlassian_support_enabled: atlassian.atlassian_support_enabled,
            atlassian_site_url: atlassian.atlassian_site_url,
            atlassian_email: atlassian.atlassian_email,
            atlassian_api_token: atlassian.atlassian_api_token,
            atlassian_confluence_space_keys: atlassian.atlassian_confluence_space_keys
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            atlassian_jira_project_keys: atlassian.atlassian_jira_project_keys
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          }),
        }),
        fetch("/api/admin/ai-providers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify((() => {
            const payload = {
              ...aiProviders,
              ai_provider_order: aiProviders.ai_provider_order
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }
            console.log('[Settings] Saving AI providers:', JSON.stringify(payload, null, 2))
            return payload
          })()),
        }),
      ])

      const s = await settingsRes.json()
      const a = await atlassianRes.json()
      const p = await aiRes.json()

      if (s.success && a.success && p.success) {
        toast.success("Settings updated successfully")
        // Refresh the page to reload settings and clear "has changes" state
        await fetchSettings()
        setHasChanges(false)
      } else {
        toast.error(s.error || a.error || p.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("Failed to update settings:", error)
      toast.error("Failed to update settings")
    } finally {
      setSaving(false)
    }
  }

  const handleTestAtlassian = async () => {
    setTestingAtlassian(true)
    try {
      const res = await fetch("/api/admin/atlassian/test", { method: "POST" })
      const data = await res.json()
      
      if (data.success) {
        toast.success("✅ Atlassian connection successful!", {
          description: "Both Jira and Confluence APIs are working correctly.",
          duration: 5000,
        })
      } else {
        // Show detailed error for each service
        const jiraStatus = data.results?.jira?.ok ? "✅ Jira OK" : `❌ Jira: ${data.results?.jira?.status || "Failed"}`
        const confluenceStatus = data.results?.confluence?.ok ? "✅ Confluence OK" : `❌ Confluence: ${data.results?.confluence?.status || "Failed"}`
        
        toast.error("Atlassian connection failed", {
          description: `${jiraStatus}\n${confluenceStatus}`,
          duration: 7000,
        })
      }
    } catch (e) {
      toast.error("Atlassian connection test failed", {
        description: "Network error or server issue. Check console for details.",
      })
    } finally {
      setTestingAtlassian(false)
    }
  }

  const handleTestProviders = async () => {
    setTestingProviders(true)
    try {
      const res = await fetch("/api/admin/ai-providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Say OK." }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Provider OK: ${data.result.provider} (${data.result.model})`)
      } else {
        toast.error(data.error || "Provider test failed")
      }
    } catch (e) {
      toast.error("Provider test failed")
    } finally {
      setTestingProviders(false)
    }
  }

  return (
    <SuperAdminGuard>
    <AdminLayout>
      <div className="p-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Settings", href: "/admin/settings" },
          ]}
        />

        <div className="flex items-center justify-between mb-6 mt-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-2">
              <Settings2 className="w-8 h-8" />
              Site Settings
            </h1>
            <p className="text-neutral-600 mt-1">Manage global site configuration</p>
          </div>
        </div>

        {hasChanges && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              You have unsaved changes. Click "Save Settings" to apply your changes.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Default Values */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Default Values</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taxPercentage">Default Tax Percentage (%)</Label>
                  <Input
                    id="taxPercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.defaults.taxPercentage}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        defaults: { ...prev.defaults, taxPercentage: e.target.value },
                      }))
                    }
                    placeholder="19.00"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Used when country-specific rate is not available
                  </p>
                </div>

                <div>
                  <Label htmlFor="shippingPrice">Default Shipping Price</Label>
                  <Input
                    id="shippingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.defaults.shippingPrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        defaults: { ...prev.defaults, shippingPrice: e.target.value },
                      }))
                    }
                    placeholder="0.00"
                  />
                  <p className="text-xs text-neutral-500 mt-1">0.00 for free shipping</p>
                </div>

                <div>
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={formData.defaults.currency}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        defaults: { ...prev.defaults, currency: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Display Settings */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Display Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input
                    id="currencySymbol"
                    type="text"
                    maxLength={3}
                    value={formData.display.currencySymbol}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        display: { ...prev.display, currencySymbol: e.target.value },
                      }))
                    }
                    placeholder="$"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Symbol displayed before prices (e.g., $, €, £)
                  </p>
                </div>

                <div>
                  <Label htmlFor="currencyLocale">Currency Locale</Label>
                  <Select
                    value={formData.display.currencyLocale}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        display: { ...prev.display, currencyLocale: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">en-US (1,234.56)</SelectItem>
                      <SelectItem value="de-DE">de-DE (1.234,56)</SelectItem>
                      <SelectItem value="en-GB">en-GB (1,234.56)</SelectItem>
                      <SelectItem value="fr-FR">fr-FR (1 234,56)</SelectItem>
                      <SelectItem value="ja-JP">ja-JP (1,234.56)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-500 mt-1">
                    Format for displaying numbers and currency
                  </p>
                </div>
              </div>
            </Card>

            {/* AI Providers (fallback chain) */}
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-xl font-bold text-neutral-900 mb-2">AI Providers (Fallback Chain)</h2>
              <p className="text-sm text-neutral-600 mb-6">
                Configure multiple AI providers. The chatbot will try them in order until one succeeds.
                This prevents downtime when a provider runs out of quota.
              </p>

              <div className="space-y-4">
                <div>
                  <Label>Provider Order</Label>
                  <Input
                    value={aiProviders.ai_provider_order}
                    onChange={(e) => setAiProviders((p) => ({ ...p, ai_provider_order: e.target.value }))}
                    placeholder="huggingface,groq,gemini,together,openai"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Comma-separated. Example: huggingface,groq,gemini,together,openai</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(["huggingface", "groq", "gemini", "together", "openai"] as const).map((prov) => (
                    <div key={prov} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold text-neutral-900 capitalize">{prov}</p>
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!(aiProviders.ai_provider_enabled as any)[prov]}
                            onChange={(e) =>
                              setAiProviders((p) => ({
                                ...p,
                                ai_provider_enabled: {
                                  ...p.ai_provider_enabled,
                                  [prov]: e.target.checked,
                                },
                              }))
                            }
                            className="sr-only"
                          />
                          {(() => {
                            const enabled = !!(aiProviders.ai_provider_enabled as any)[prov]
                            return (
                              <span
                                className={`w-12 h-6 rounded-full relative transition-colors ${
                                  enabled ? "bg-neutral-900" : "bg-neutral-300"
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                    enabled ? "translate-x-6" : "translate-x-0"
                                  }`}
                                />
                              </span>
                            )
                          })()}
                        </label>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">API Key</Label>
                        <Input
                          type="password"
                          value={(aiProviders as any)[`${prov}_api_key`] || ""}
                          onChange={(e) => setAiProviders((p) => ({ ...p, [`${prov}_api_key`]: e.target.value } as any))}
                          placeholder="Paste key here"
                        />
                        {(() => {
                          const keyVal = String((aiProviders as any)[`${prov}_api_key`] || "")
                          const hasKey = keyVal === "********" || keyVal.trim().length > 0
                          return !hasKey ? (
                            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                              ℹ️ No key in DB. If you have one in .env.local, the provider will still work. Otherwise, add a key here.
                            </p>
                          ) : null
                        })()}

                        <Label className="text-xs">Model</Label>
                        <Input
                          value={(aiProviders as any)[`${prov}_model`] || ""}
                          onChange={(e) => setAiProviders((p) => ({ ...p, [`${prov}_model`]: e.target.value } as any))}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={handleTestProviders} disabled={testingProviders}>
                    {testingProviders ? "Testing..." : "Test Providers"}
                  </Button>
                  <p className="text-xs text-neutral-500">Runs a short test prompt through the fallback chain.</p>
                </div>
              </div>
            </Card>

            {/* Atlassian Integration */}
            <Card className="p-6 lg:col-span-2">
              <h2 className="text-xl font-bold text-neutral-900 mb-2 flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Atlassian (Jira + Confluence) Support Context
              </h2>
              <p className="text-sm text-neutral-600 mb-6">
                When enabled, the AI will search your Jira issues and Confluence pages for relevant context before answering.
                This makes responses grounded in your internal documentation and live incident status.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div>
                    <p className="font-semibold text-neutral-900">Enable Atlassian context (Provider C)</p>
                    <p className="text-xs text-neutral-500">Uses safe summaries only. No Jira comments are fetched.</p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={atlassian.atlassian_support_enabled}
                      onChange={(e) => setAtlassian((p) => ({ ...p, atlassian_support_enabled: e.target.checked }))}
                      className="sr-only"
                    />
                    <span
                      className={`w-12 h-6 rounded-full relative transition-colors ${
                        atlassian.atlassian_support_enabled ? "bg-neutral-900" : "bg-neutral-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          atlassian.atlassian_support_enabled ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="atlassianSite">Atlassian Site URL</Label>
                    <Input
                      id="atlassianSite"
                      value={atlassian.atlassian_site_url}
                      onChange={(e) => setAtlassian((p) => ({ ...p, atlassian_site_url: e.target.value }))}
                      placeholder="https://your-domain.atlassian.net"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Do not include /wiki</p>
                  </div>

                  <div>
                    <Label htmlFor="atlassianEmail">Atlassian Email</Label>
                    <Input
                      id="atlassianEmail"
                      type="email"
                      value={atlassian.atlassian_email}
                      onChange={(e) => setAtlassian((p) => ({ ...p, atlassian_email: e.target.value }))}
                      placeholder="you@company.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="atlassianToken">Atlassian API Token</Label>
                    <Input
                      id="atlassianToken"
                      type="password"
                      value={atlassian.atlassian_api_token}
                      onChange={(e) => setAtlassian((p) => ({ ...p, atlassian_api_token: e.target.value }))}
                      placeholder="Paste token here"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      You can rotate this anytime. Stored in site_settings.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confluenceSpaces">Confluence Space Keys (optional)</Label>
                    <Input
                      id="confluenceSpaces"
                      value={atlassian.atlassian_confluence_space_keys}
                      onChange={(e) => setAtlassian((p) => ({ ...p, atlassian_confluence_space_keys: e.target.value }))}
                      placeholder="SUPPORT,DOCS"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Comma-separated. Empty = all spaces.</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="jiraProjects">Jira Project Keys (optional)</Label>
                    <Input
                      id="jiraProjects"
                      value={atlassian.atlassian_jira_project_keys}
                      onChange={(e) => setAtlassian((p) => ({ ...p, atlassian_jira_project_keys: e.target.value }))}
                      placeholder="SUPPORT,OPS"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Comma-separated. Empty = all projects.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={handleTestAtlassian} disabled={testingAtlassian}>
                    <TestTube className="w-4 h-4 mr-2" />
                    {testingAtlassian ? "Testing..." : "Test Connection"}
                  </Button>
                  <p className="text-xs text-neutral-500">
                    This will test Jira + Confluence API access using the saved credentials.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
    </SuperAdminGuard>
  )
}
