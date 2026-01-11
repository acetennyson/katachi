# 🔑 AI Provider API Keys - Complete Guide

This guide will help you get **FREE** API keys for all supported AI providers.

---

## 🚀 Quick Summary

| Provider | Free Tier | Speed | Best For |
|----------|-----------|-------|----------|
| **Groq** ⭐ | ✅ Generous | ⚡ Very Fast | **RECOMMENDED** - Production use |
| **Hugging Face** | ✅ Yes | 🐢 Slower | Backup/fallback |
| **Together AI** | ✅ Limited | ⚡ Fast | Alternative to Groq |
| **Google Gemini** | ✅ Generous | ⚡ Fast | Google ecosystem users |
| **OpenAI** | ❌ Paid only | ⚡ Fast | Premium quality (costs $) |

**💡 Recommendation:** Start with **Groq** (best free tier) + **Hugging Face** (backup).

---

## 1️⃣ Groq (RECOMMENDED - FREE & FAST)

**Best free tier with blazing fast inference!**

### Steps:
1. **Sign up:** https://console.groq.com/
2. Click **"API Keys"** in the left sidebar
3. Click **"Create API Key"**
4. Give it a name (e.g., "Katachi Furniture")
5. Copy the key (starts with `gsk_...`)

### Free Tier:
- ✅ **14,400 requests per day** (very generous!)
- ✅ **No credit card required**
- ✅ Super fast inference (< 1 second responses)

### Add to your project:
```bash
# In .env.local
GROQ_API_KEY=gsk_your_key_here
```

### Test it:
```bash
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer gsk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-8b-instant",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 50
  }'
```

---

## 2️⃣ Hugging Face (FREE - Good Backup)

**Completely free, runs on serverless infrastructure**

### Steps:
1. **Sign up:** https://huggingface.co/join
2. Go to **Settings:** https://huggingface.co/settings/tokens
3. Click **"New token"**
4. Select **"Read"** access (sufficient for inference)
5. Copy the token (starts with `hf_...`)

### Free Tier:
- ✅ **Completely free** (no limits listed)
- ✅ No credit card required
- 🐢 Slower than Groq (cold starts can take 10-20s)

### Add to your project:
```bash
# In .env.local
HUGGINGFACE_API_KEY=hf_your_key_here
HF_MODEL=meta-llama/Llama-3.2-3B-Instruct
```

### Test it:
```bash
curl https://router.huggingface.co/v1/chat/completions \
  -H "Authorization: Bearer hf_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.2-3B-Instruct",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 50
  }'
```

---

## 3️⃣ Together AI (FREE - Fast Alternative)

**Good Groq alternative with generous free tier**

### Steps:
1. **Sign up:** https://api.together.xyz/signup
2. Go to **Settings** → **API Keys**
3. Click **"Create new API Key"**
4. Copy the key (starts with a long random string)

### Free Tier:
- ✅ **$25 free credits** on signup
- ✅ No credit card required for free tier
- ⚡ Fast inference

### Add to your project:
```bash
# In .env.local
TOGETHER_API_KEY=your_key_here
```

### Test it:
```bash
curl https://api.together.xyz/v1/chat/completions \
  -H "Authorization: Bearer your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.1-8B-Instruct-Turbo",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 50
  }'
```

---

## 4️⃣ Google Gemini (FREE - Very Generous)

**Google's AI with excellent free tier**

### Steps:
1. **Go to:** https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click **"Create API Key"**
4. Select a Google Cloud project (or create new one)
5. Copy the key (starts with `AIza...`)

### Free Tier:
- ✅ **15 requests per minute**
- ✅ **1,500 requests per day**
- ✅ No credit card required

### Add to your project:
```bash
# In .env.local
GEMINI_API_KEY=AIza_your_key_here
```

### Test it:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIza_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello!"}]
    }]
  }'
```

---

## 5️⃣ OpenAI (PAID - Premium Quality)

**Best quality, but requires payment**

### Steps:
1. **Sign up:** https://platform.openai.com/signup
2. **Add payment method** (required - no free tier)
3. Go to **API Keys:** https://platform.openai.com/api-keys
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-...`)

### Pricing:
- ❌ **No free tier**
- 💰 **GPT-4o-mini:** ~$0.15 per 1M input tokens
- 💰 **GPT-4o:** ~$2.50 per 1M input tokens

### Add to your project:
```bash
# In .env.local
OPENAI_API_KEY=sk-your_key_here
```

### Test it:
```bash
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 50
  }'
```

---

## 📝 Complete .env.local Example

```bash
# Recommended: Groq (primary) + Hugging Face (backup)
GROQ_API_KEY=gsk_your_groq_key_here
HUGGINGFACE_API_KEY=hf_your_huggingface_key_here

# Optional: Additional providers
TOGETHER_API_KEY=your_together_key_here
GEMINI_API_KEY=AIza_your_gemini_key_here
OPENAI_API_KEY=sk-your_openai_key_here

# Model preferences (optional - has defaults)
HF_MODEL=meta-llama/Llama-3.2-3B-Instruct
```

---

## 🎯 How to Configure in Admin Panel

After getting your API keys, configure them in the admin panel:

1. Go to: **http://localhost:3000/admin/settings**
2. Scroll to **"AI Provider Configuration"**
3. Paste your API keys in the respective fields
4. Toggle providers ON/OFF
5. Set the fallback order (drag to reorder)
6. Click **"Test Configuration"** to verify
7. Click **"Save Settings"**

---

## 🔄 Provider Fallback Chain

The system tries providers in order until one succeeds:

**Default order:**
1. Groq → (if fails or disabled)
2. Hugging Face → (if fails or disabled)
3. Together AI → (if fails or disabled)
4. Gemini → (if fails or disabled)
5. OpenAI (if enabled)

**Example:** If Groq is down, it automatically uses Hugging Face as backup!

---

## ⚡ Performance Comparison

Based on real-world testing:

| Provider | Avg Response Time | Reliability |
|----------|------------------|-------------|
| Groq | 0.5-2s | ⭐⭐⭐⭐⭐ |
| Together AI | 1-3s | ⭐⭐⭐⭐⭐ |
| Gemini | 1-2s | ⭐⭐⭐⭐⭐ |
| OpenAI | 1-3s | ⭐⭐⭐⭐⭐ |
| Hugging Face | 5-20s (cold start) | ⭐⭐⭐ |

---

## 🆘 Troubleshooting

### "Missing API key" error
- Check your `.env.local` file has the correct key format
- Restart your dev server after adding keys

### "Rate limit exceeded"
- You've hit the free tier limit
- Wait for the limit to reset (usually 24 hours)
- Or add another provider as fallback

### "Invalid API key"
- Key might have been regenerated/revoked
- Get a new key from the provider dashboard
- Make sure there are no extra spaces or quotes

### Slow responses
- Hugging Face has cold starts (10-20s first time)
- Use Groq or Together AI for faster responses
- Knowledge base caching helps avoid repeated AI calls

---

## 🎉 You're All Set!

**Recommended setup for production:**
- ✅ Groq (primary - fast & free)
- ✅ Hugging Face (backup - always free)
- ✅ Gemini or Together AI (optional extra backup)

This gives you a reliable multi-provider setup with excellent failover!

**Questions?** Check the test commands above to verify each provider works.
