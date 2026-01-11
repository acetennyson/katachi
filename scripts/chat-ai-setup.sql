-- ============================================================
-- CHAT + AI SUPPORT ONLY SETUP (SAFE RESET)
-- ============================================================
-- This script DROPS and RECREATES only the tables/functions needed for:
-- - AI chatbot
-- - knowledge base caching
-- - chat logs (with provider/model)
-- - AI provider router settings stored in site_settings
-- - Atlassian context settings stored in site_settings (optional)
--
-- Run in Supabase SQL Editor or psql.
-- ============================================================

BEGIN;

-- ============================================================
-- 1) DROP (RESET)
-- ============================================================

DROP FUNCTION IF EXISTS get_chat_stats();

DROP TABLE IF EXISTS chat_logs;
DROP TABLE IF EXISTS chat_knowledge_base;

-- ============================================================
-- 2) RECREATE TABLES
-- ============================================================

-- Chat Knowledge Base
CREATE TABLE chat_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  use_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW()
);
i tur