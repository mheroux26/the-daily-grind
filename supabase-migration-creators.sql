-- ============================================================
-- Migration: Community BookTok Creators + User Profiles
-- Run this in Supabase SQL Editor AFTER the initial schema
-- ============================================================

-- 5. Community-submitted BookTok creators
CREATE TABLE IF NOT EXISTS creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  tiktok_handle TEXT,
  tiktok_url TEXT,
  instagram_url TEXT,
  avatar_emoji TEXT DEFAULT '📚',
  is_self BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Add social profile columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creators_submitted_by ON creators(submitted_by);

-- RLS (open for prototype)
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON creators FOR ALL USING (true) WITH CHECK (true);
