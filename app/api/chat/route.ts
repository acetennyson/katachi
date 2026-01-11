import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { aiService } from "@/lib/ai-service"
import type { ChatMessage } from "@/lib/ai-service"
import { fetchAtlassianContext } from "@/lib/atlassian-context"
import { chatWithFallback } from "@/lib/ai-providers"

/**
 * POST /api/chat
 * 
 * Customer support chatbot endpoint
 * 
 * Flow:
 * 1. Check knowledge base for similar questions
 * 2. If found, return cached answer (instant, free)
 * 3. If not found, query AI for answer
 * 4. Save Q&A to knowledge base for future use
 * 5. Return response to user
 */
export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await req.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Initialize Supabase
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Step 1: Check knowledge base for similar questions
    const cachedAnswer = await checkKnowledgeBase(supabase, message)
    
    if (cachedAnswer) {
      console.log("[AI Chat] Using cached answer from knowledge base")
      
      // Log the interaction
      await logChatInteraction(supabase, message, cachedAnswer, "knowledge_base", "knowledge_base", "")
      
      return NextResponse.json({
        response: cachedAnswer,
        source: "knowledge_base",
      })
    }

    // Step 2: (Provider C) Fetch Atlassian context (Jira + Confluence) if enabled
    const atlassianContext = await fetchAtlassianContext(message)

    const atlassianPrompt = atlassianContext
      ? buildAtlassianPrompt(atlassianContext)
      : null

    // Step 3: Build conversation context
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: aiService.getSystemPrompt(),
      },
      ...(atlassianPrompt
        ? ([
            {
              role: "system",
              content: atlassianPrompt,
            },
          ] as ChatMessage[])
        : []),
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ]

    // Step 3: Get AI response (Provider router with fallback chain)
    console.log("[AI Chat] Querying AI providers (fallback chain)...")
    const result = await chatWithFallback(messages)

    // Step 4: Save to knowledge base
    await saveToKnowledgeBase(supabase, message, result.content)

    // Step 5: Log the interaction
    await logChatInteraction(supabase, message, result.content, "ai", result.provider, result.model)

    return NextResponse.json({
      response: result.content,
      source: "ai",
      provider: result.provider,
      model: result.model,
    })
  } catch (error: any) {
    console.error("[AI Chat] Error:", error)
    
    // Fallback response
    return NextResponse.json({
      response: "I'm having trouble connecting right now. Please try again in a moment, or contact our support team at support@katachi.com for immediate assistance.",
      source: "fallback",
      error: error.message,
    })
  }
}

function buildAtlassianPrompt(ctx: any): string {
  const confluence = (ctx.confluence ?? [])
    .map((p: any, idx: number) => {
      return `Confluence Source ${idx + 1}:\nTitle: ${p.title}\nURL: ${p.url ?? ""}\nExcerpt: ${p.excerpt}`
    })
    .join("\n\n")

  const jira = (ctx.jira ?? [])
    .map((i: any, idx: number) => {
      return `Jira Issue ${idx + 1}:\nKey: ${i.key}\nStatus: ${i.status ?? ""}\nUpdated: ${i.updated ?? ""}\nURL: ${i.url ?? ""}\nSummary: ${i.summary}\nExcerpt: ${i.excerpt ?? ""}`
    })
    .join("\n\n")

  return `You have access to internal Atlassian knowledge sources (Confluence docs + Jira issues) relevant to the user's question.

Rules:
- Use these sources as primary reference.
- If the sources do not contain the answer, say you are not sure and suggest contacting human support.
- Do NOT reveal internal-only details; only provide safe summaries suitable for a customer.

${confluence ? `--- Confluence ---\n${confluence}` : ""}

${jira ? `--- Jira ---\n${jira}` : ""}`
}

/**
 * Check knowledge base for similar questions
 * Returns cached answer if found
 */
async function checkKnowledgeBase(
  supabase: any,
  question: string
): Promise<string | null> {
  try {
    const normalizedQuestion = question.toLowerCase().trim()
    
    // First try exact match
    const { data: exactMatch } = await supabase
      .from("chat_knowledge_base")
      .select("id, question, answer, use_count")
      .ilike("question", normalizedQuestion)
      .limit(1)
      .single()

    if (exactMatch) {
      await incrementKnowledgeBaseUsage(supabase, exactMatch.id)
      return exactMatch.answer
    }

    // If no exact match, get all questions and find best similarity match
    const { data: allQuestions, error } = await supabase
      .from("chat_knowledge_base")
      .select("id, question, answer, use_count")
      .order("use_count", { ascending: false })
      .limit(100) // Limit to top 100 most used questions

    if (error || !allQuestions || allQuestions.length === 0) {
      return null
    }

    // Calculate similarity scores
    const matches = allQuestions.map((entry: any) => ({
      ...entry,
      similarity: calculateSimilarity(normalizedQuestion, entry.question.toLowerCase())
    }))

    // Filter by minimum similarity threshold
    const bestMatch = matches
      .filter(m => m.similarity >= 0.7) // 70% similarity threshold
      .sort((a, b) => b.similarity - a.similarity)[0]

    if (bestMatch) {
      console.log(`[Knowledge Base] Found similar question (${Math.round(bestMatch.similarity * 100)}% match): "${bestMatch.question}"`)
      await incrementKnowledgeBaseUsage(supabase, bestMatch.id)
      return bestMatch.answer
    }

    return null
  } catch (error) {
    console.error("[Knowledge Base] Error checking:", error)
    return null
  }
}

/**
 * Calculate similarity between two strings using Jaccard similarity
 * Returns a score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Tokenize (split into words)
  const tokens1 = new Set(str1.split(/\s+/).filter(w => w.length > 2)) // Filter out short words
  const tokens2 = new Set(str2.split(/\s+/).filter(w => w.length > 2))

  // Calculate Jaccard similarity: intersection / union
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)))
  const union = new Set([...tokens1, ...tokens2])

  if (union.size === 0) return 0
  
  const jaccardSimilarity = intersection.size / union.size

  // Also check for substring matches (for short queries)
  const substringBonus = str1.includes(str2) || str2.includes(str1) ? 0.2 : 0

  // Penalize large length differences
  const lengthRatio = Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length)
  const lengthPenalty = lengthRatio < 0.5 ? 0.2 : 0

  return Math.min(1, jaccardSimilarity + substringBonus - lengthPenalty)
}

/**
 * Increment knowledge base usage counter
 */
async function incrementKnowledgeBaseUsage(supabase: any, id: number): Promise<void> {
  try {
    // First get current count
    const { data } = await supabase
      .from("chat_knowledge_base")
      .select("use_count")
      .eq("id", id)
      .single()
    
    if (data) {
      await supabase
        .from("chat_knowledge_base")
        .update({
          use_count: data.use_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", id)
    }
  } catch (error) {
    console.error("[Knowledge Base] Error incrementing usage:", error)
  }
}

/**
 * Save Q&A to knowledge base for future use
 */
async function saveToKnowledgeBase(
  supabase: any,
  question: string,
  answer: string
): Promise<void> {
  try {
    const { error } = await supabase.from("chat_knowledge_base").insert({
      question: question.trim(),
      answer: answer.trim(),
      use_count: 1,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[Knowledge Base] Error saving:", error)
    }
  } catch (error) {
    console.error("[Knowledge Base] Error saving:", error)
  }
}

/**
 * Log chat interaction for analytics
 */
async function logChatInteraction(
  supabase: any,
  question: string,
  answer: string,
  source: string,
  provider?: string,
  model?: string
): Promise<void> {
  try {
    await supabase.from("chat_logs").insert({
      question,
      answer,
      source,
      provider,
      model,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Chat Log] Error logging:", error)
  }
}
