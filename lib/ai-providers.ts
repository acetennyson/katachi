import type { ChatMessage } from "@/lib/ai-service"
import { getSupabaseServiceRole } from "@/lib/supabase"

export type ProviderName = "huggingface" | "groq" | "gemini" | "together" | "openai"

export type ProviderResult = {
  provider: ProviderName
  model: string
  content: string
  raw?: any
}

type ProviderConfig = {
  order: ProviderName[]
  enabled: Record<ProviderName, boolean>
  huggingface: { apiKey: string; model: string }
  groq: { apiKey: string; model: string }
  gemini: { apiKey: string; model: string }
  together: { apiKey: string; model: string }
  openai: { apiKey: string; model: string }
}

async function getSetting<T = any>(key: string): Promise<T | null> {
  const supabase = await getSupabaseServiceRole()
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).single()
  return (data?.value as T) ?? null
}

export async function loadProviderConfig(): Promise<ProviderConfig> {
  const order = (await getSetting<ProviderName[]>("ai_provider_order")) ?? [
    "huggingface",
    "groq",
    "gemini",
    "together",
    "openai",
  ]

  const enabled = (await getSetting<Record<string, boolean>>("ai_provider_enabled")) ?? {
    huggingface: true,
    groq: true,
    gemini: false,
    together: false,
    openai: false,
  }

  return {
    order,
    enabled: enabled as any,
    huggingface: {
      apiKey: (await getSetting<string>("huggingface_api_key")) ?? process.env.HUGGINGFACE_API_KEY ?? "",
      model: (await getSetting<string>("huggingface_model")) ?? process.env.HF_MODEL ?? "meta-llama/Llama-3.2-3B-Instruct",
    },
    groq: {
      apiKey: (await getSetting<string>("groq_api_key")) ?? process.env.GROQ_API_KEY ?? "",
      model: (await getSetting<string>("groq_model")) ?? "llama-3.1-8b-instant",
    },
    gemini: {
      apiKey: (await getSetting<string>("gemini_api_key")) ?? process.env.GEMINI_API_KEY ?? "",
      model: (await getSetting<string>("gemini_model")) ?? "gemini-1.5-flash",
    },
    together: {
      apiKey: (await getSetting<string>("together_api_key")) ?? process.env.TOGETHER_API_KEY ?? "",
      model: (await getSetting<string>("together_model")) ?? "meta-llama/Llama-3.1-8B-Instruct-Turbo",
    },
    openai: {
      apiKey: (await getSetting<string>("openai_api_key")) ?? process.env.OPENAI_API_KEY ?? "",
      model: (await getSetting<string>("openai_model")) ?? "gpt-4o-mini",
    },
  }
}

function toOpenAIMessages(messages: ChatMessage[]) {
  // already compatible: {role, content}
  return messages
}

async function openAICompatibleChat(opts: {
  baseUrl: string
  apiKey: string
  model: string
  messages: ChatMessage[]
}): Promise<string> {
  const res = await fetch(`${opts.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      messages: toOpenAIMessages(opts.messages),
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 500,
    }),
    // @ts-ignore
    cache: "no-store",
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`${res.status} ${res.statusText} ${t}`)
  }

  const data: any = await res.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new Error("No content in response")
  return content
}

async function chatGemini(opts: { apiKey: string; model: string; messages: ChatMessage[] }): Promise<string> {
  // Gemini REST API: https://ai.google.dev/api/rest
  // We'll convert chat into a single prompt to keep it simple.
  const prompt = opts.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n")

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(opts.apiKey)}`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 500,
      },
    }),
    // @ts-ignore
    cache: "no-store",
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(`${res.status} ${res.statusText} ${t}`)
  }

  const data: any = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("")
  if (!text) throw new Error("No content in Gemini response")
  return text
}

export async function chatWithFallback(messages: ChatMessage[]): Promise<ProviderResult> {
  const cfg = await loadProviderConfig()

  const errors: Array<{ provider: ProviderName; error: string }> = []

  for (const provider of cfg.order) {
    if (!cfg.enabled[provider]) continue

    try {
      if (provider === "huggingface") {
        if (!cfg.huggingface.apiKey) throw new Error("missing huggingface_api_key")
        const content = await openAICompatibleChat({
          baseUrl: "https://router.huggingface.co/v1",
          apiKey: cfg.huggingface.apiKey,
          model: cfg.huggingface.model,
          messages,
        })
        return { provider, model: cfg.huggingface.model, content }
      }

      if (provider === "groq") {
        if (!cfg.groq.apiKey) throw new Error("missing groq_api_key")
        const content = await openAICompatibleChat({
          baseUrl: "https://api.groq.com/openai/v1",
          apiKey: cfg.groq.apiKey,
          model: cfg.groq.model,
          messages,
        })
        return { provider, model: cfg.groq.model, content }
      }

      if (provider === "together") {
        if (!cfg.together.apiKey) throw new Error("missing together_api_key")
        const content = await openAICompatibleChat({
          baseUrl: "https://api.together.xyz/v1",
          apiKey: cfg.together.apiKey,
          model: cfg.together.model,
          messages,
        })
        return { provider, model: cfg.together.model, content }
      }

      if (provider === "openai") {
        if (!cfg.openai.apiKey) throw new Error("missing openai_api_key")
        const content = await openAICompatibleChat({
          baseUrl: "https://api.openai.com/v1",
          apiKey: cfg.openai.apiKey,
          model: cfg.openai.model,
          messages,
        })
        return { provider, model: cfg.openai.model, content }
      }

      if (provider === "gemini") {
        if (!cfg.gemini.apiKey) throw new Error("missing gemini_api_key")
        const content = await chatGemini({ apiKey: cfg.gemini.apiKey, model: cfg.gemini.model, messages })
        return { provider, model: cfg.gemini.model, content }
      }
    } catch (e: any) {
      errors.push({ provider, error: e?.message ?? String(e) })
      continue
    }
  }

  const errorSummary = errors.map((e) => `${e.provider}: ${e.error}`).join(" | ")
  throw new Error(`All providers failed: ${errorSummary}`)
}
