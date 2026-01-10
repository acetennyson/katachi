import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { aiService } from "@/lib/ai-service"
import type { ChatMessage } from "@/lib/ai-service"

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
      await logChatInteraction(supabase, message, cachedAnswer, "knowledge_base")
      
      return NextResponse.json({
        response: cachedAnswer,
        source: "knowledge_base",
      })
    }

    // Step 2: Build conversation context
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: aiService.getSystemPrompt(),
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: message,
      },
    ]

    // Step 3: Get AI response
    console.log("[AI Chat] Querying AI for response...")
    const aiResponse = await aiService.chat(messages)

    // Step 4: Save to knowledge base
    await saveToKnowledgeBase(supabase, message, aiResponse)

    // Step 5: Log the interaction
    await logChatInteraction(supabase, message, aiResponse, "ai")

    return NextResponse.json({
      response: aiResponse,
      source: "ai",
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

/**
 * Check knowledge base for similar questions
 * Returns cached answer if found
 */
async function checkKnowledgeBase(
  supabase: any,
  question: string
): Promise<string | null> {
  try {
    // Simple exact match for now
    // TODO: Add semantic search with embeddings later
    const { data, error } = await supabase
      .from("chat_knowledge_base")
      .select("answer, use_count")
      .ilike("question", `%${question.toLowerCase().trim()}%`)
      .order("use_count", { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    // Increment use count
    await supabase
      .from("chat_knowledge_base")
      .update({
        use_count: data.use_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("question", question)

    return data.answer
  } catch (error) {
    console.error("[Knowledge Base] Error checking:", error)
    return null
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
  source: string
): Promise<void> {
  try {
    await supabase.from("chat_logs").insert({
      question,
      answer,
      source,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Chat Log] Error logging:", error)
  }
}
