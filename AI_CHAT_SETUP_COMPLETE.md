# ✅ AI Customer Support System - Complete Setup

## 🎉 What's Been Built

Your Katachi Furniture store now has a **complete AI customer support system** with admin management!

---

## 📋 Features Implemented

### **1. User-Facing Chatbot** ✅
- ✅ Floating chat button (bottom-right corner on all pages)
- ✅ Beautiful slide-up chat window
- ✅ Real-time AI responses using Hugging Face (free)
- ✅ Smart caching - checks knowledge base first
- ✅ Shows source of answer (cached vs AI generated)

### **2. Admin Knowledge Base Management** ✅
- ✅ `/admin/knowledge-base` - Full CRUD interface
- ✅ Add pre-defined Q&A pairs
- ✅ Edit existing entries
- ✅ Delete unwanted entries
- ✅ Search functionality
- ✅ Shows usage statistics (how many times each answer was used)

### **3. Admin Chat Logs & Analytics** ✅
- ✅ `/admin/chat-logs` - View all customer conversations
- ✅ Real-time statistics dashboard:
  - Total chats
  - Cached responses (instant, free)
  - AI-generated responses (Hugging Face API)
  - Fallback responses (errors)
- ✅ Filter by source type
- ✅ Track what customers are asking

### **4. Database Tables** ✅
- ✅ `chat_knowledge_base` - Stores Q&A pairs with usage tracking
- ✅ `chat_logs` - Logs all conversations for analytics
- ✅ Proper indexes for performance
- ✅ SQL function for statistics

### **5. API Endpoints** ✅
- ✅ `POST /api/chat` - Customer chatbot endpoint
- ✅ `GET /api/admin/knowledge-base` - List all entries
- ✅ `POST /api/admin/knowledge-base` - Create entry
- ✅ `PUT /api/admin/knowledge-base/[id]` - Update entry
- ✅ `DELETE /api/admin/knowledge-base/[id]` - Delete entry
- ✅ `GET /api/admin/chat-logs` - Get chat logs with stats

---

## 🚀 Setup Instructions

### **Step 1: Set Up Hugging Face (Free AI)**

1. **Create account:** https://huggingface.co/join
2. **Get API token:** https://huggingface.co/settings/tokens
   - Click "New token"
   - Name: `katachi-ai-support`
   - Type: **Read**
   - Copy the token (starts with `hf_`)

3. **Add to `.env.local`:**
```bash
HUGGINGFACE_API_KEY=hf_YourTokenHere
USE_OLLAMA=false
```

---

### **Step 2: Set Up Database Tables**

**Option A: Supabase SQL Editor (Easiest)**
1. Go to: https://ljloqfftmtumfxonfeih.supabase.co/project/_/sql/new
2. Copy & paste this SQL:

```sql
-- Chat Knowledge Base
CREATE TABLE IF NOT EXISTS chat_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  use_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW()
);

-- Chat Logs
CREATE TABLE IF NOT EXISTS chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_kb_question ON chat_knowledge_base(question);
CREATE INDEX IF NOT EXISTS idx_chat_kb_use_count ON chat_knowledge_base(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_logs_source ON chat_logs(source);

-- Stats function
CREATE OR REPLACE FUNCTION get_chat_stats()
RETURNS TABLE (
  total BIGINT,
  knowledge_base BIGINT,
  ai BIGINT,
  fallback BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE source = 'knowledge_base') as knowledge_base,
    COUNT(*) FILTER (WHERE source = 'ai') as ai,
    COUNT(*) FILTER (WHERE source = 'fallback') as fallback
  FROM chat_logs;
END;
$$ LANGUAGE plpgsql;
```

3. Click **Run**

**Option B: Command Line**
```bash
psql "$DATABASE_URL" -f scripts/00-complete-setup.sql
```

---

### **Step 3: Restart Dev Server**

```bash
pnpm dev
```

---

## 🧪 Testing the System

### **Test User-Facing Chatbot**

1. Visit: http://localhost:3000
2. Click the chat button (bottom-right corner)
3. Ask: "Do you ship internationally?"
4. You should get an AI response!

### **Test Admin Panel**

1. **Go to:** http://localhost:3000/admin/knowledge-base
2. **Add a new entry:**
   - Question: "What is your return policy?"
   - Answer: "We offer a 30-day return policy on all furniture. Items must be unused and in original packaging."
   - Click "Create Entry"

3. **Test it works:**
   - Go back to the homepage
   - Open chatbot
   - Ask: "What is your return policy?"
   - You should get the instant cached answer! ⚡

4. **View logs:** http://localhost:3000/admin/chat-logs
   - See all customer questions
   - View statistics dashboard
   - Filter by source type

---

## 📊 How It Works

### **Smart Caching System**

```
Customer asks question
    ↓
Check knowledge_base table
    ↓
Found? → Return cached answer (instant, free!)
    ↓
Not found? → Query Hugging Face AI
    ↓
Save answer to knowledge_base
    ↓
Next time = instant!
```

### **Learning Over Time**

- **Day 1:** 100% AI calls (slow, uses API)
- **Week 1:** 50% cached (common questions saved)
- **Month 1:** 80%+ cached (most questions instant!)
- **Result:** Fast responses + minimal API costs

---

## 💰 Cost Breakdown

### **Hugging Face Free Tier**
- ✅ **30,000 input tokens/month FREE**
- ✅ ~500-1,000 customer chats/month
- ✅ After free tier: $0.001 per 1,000 characters
- ✅ Example: 2,000 chats/month ≈ $3-5/month

### **Smart Caching Savings**
- Without caching: 1,000 chats = 1,000 API calls
- With caching (80%): 1,000 chats = 200 API calls
- **Savings: 80% reduction in API costs!**

---

## 🎯 Admin Workflow

### **Pre-populate Common Questions**

Go to `/admin/knowledge-base` and add:

```
Q: Do you ship internationally?
A: Yes! We ship worldwide. Shipping times: 5-7 days (US), 7-14 days (International).

Q: What payment methods do you accept?
A: We accept Credit/Debit cards, PayPal, and Bank Transfer.

Q: How can I track my order?
A: Visit the Orders page in your account or use the tracking link sent to your email.

Q: What is your return policy?
A: 30-day returns on unused items in original packaging. Refunds processed within 5-7 business days.

Q: Do you offer assembly services?
A: Yes! Assembly services are available at checkout for an additional fee.
```

### **Monitor Performance**

Check `/admin/chat-logs` regularly:
- See what customers are asking
- Identify common questions to add to knowledge base
- Track AI vs cached response ratio
- Spot any fallback errors (problems to fix)

---

## 🎨 Customization

### **Change AI Model**

Edit `.env.local`:
```bash
# Faster, cheaper
HF_MODEL=meta-llama/Llama-3.2-1B-Instruct

# More powerful
HF_MODEL=meta-llama/Llama-3.2-11B-Vision-Instruct
```

### **Update Business Context**

Edit `lib/ai-service.ts` - `getSystemPrompt()` function:
```typescript
Store Information:
- Store Name: Katachi Furniture
- Shipping: Update your shipping policy here
- Returns: Update your return policy here
- Support Email: your-email@katachi.com
```

### **Change Chat Button Position**

Edit `components/ai-chat.tsx`:
```typescript
// Line ~74
className="fixed bottom-6 right-6..."
// Change to: bottom-6 left-6 (left side)
// Or: top-6 right-6 (top right)
```

---

## 📈 Success Metrics

Track these in `/admin/chat-logs`:

1. **Cache Hit Rate:** % of knowledge_base responses
   - Goal: >80% after first month
   - Higher = faster + cheaper

2. **Total Conversations:** Track growth over time
   - Shows chatbot adoption

3. **Fallback Rate:** % of fallback responses
   - Goal: <5%
   - High fallback = issues to fix

4. **Common Questions:** What are customers asking?
   - Add popular questions to knowledge base
   - Improve product descriptions if needed

---

## 🚨 Troubleshooting

### **Chat button not showing**
```bash
# Check if imported in layout
grep "AIChat" app/layout.tsx
# Should see: import { AIChat } from "@/components/ai-chat"
```

### **"Unauthorized" error in admin**
- Make sure you're logged in as admin
- Check `profiles` table: `role` should be `'admin'`

### **Hugging Face API errors**
```bash
# Test your token
curl https://router.huggingface.co/v1/chat/completions \
  -H "Authorization: Bearer hf_YourToken" \
  -H "Content-Type: application/json" \
  -d '{"model":"meta-llama/Llama-3.2-3B-Instruct","messages":[{"role":"user","content":"Hello"}],"max_tokens":50}'
```

### **Slow responses**
- First response is slower (cold start)
- Subsequent responses faster (cached)
- Consider upgrading to paid tier for faster models

---

## 🎉 You're All Set!

Your AI customer support system is now live with full admin control!

**Quick Links:**
- Customer chatbot: All pages (bottom-right button)
- Admin knowledge base: http://localhost:3000/admin/knowledge-base
- Admin chat logs: http://localhost:3000/admin/chat-logs

**Next Steps:**
1. Pre-populate 10-20 common questions
2. Test the chatbot as a customer
3. Monitor chat logs for trends
4. Optimize based on usage patterns

**Need help?** Check `AI_SETUP.md` for detailed documentation.

Happy chatting! 🤖✨
