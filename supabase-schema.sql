-- ============================================================
-- The Daily Grind — Supabase Schema
-- Run this in your Supabase SQL Editor (supabase.com → project → SQL Editor)
-- ============================================================

-- 1. Users table (nickname-based, no passwords)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT UNIQUE NOT NULL,
  theme_preference TEXT DEFAULT 'coffeehouse',
  reading_goal INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Shared books catalog
CREATE TABLE IF NOT EXISTS books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT,
  cover_url TEXT,
  cover_fallback TEXT,
  description TEXT,
  published_date TEXT,
  page_count INTEGER,
  categories TEXT[] DEFAULT '{}',
  sub_genres TEXT[] DEFAULT '{}',
  info_link TEXT,
  amazon_url TEXT,
  isbn TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(title, authors)
);

-- 3. User library (the shelf)
CREATE TABLE IF NOT EXISTS library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'tbr' CHECK (status IN ('tbr', 'reading', 'read')),
  rating INTEGER DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- 4. Scan history (optional, for analytics later)
CREATE TABLE IF NOT EXISTS scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ocr_text TEXT,
  query_used TEXT,
  matched_book_id UUID REFERENCES books(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_library_user ON library(user_id);
CREATE INDEX IF NOT EXISTS idx_library_book ON library(book_id);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);

-- ============================================================
-- Row Level Security (RLS)
-- Open read/write for prototype (friends-only, anon key)
-- Tighten these before public launch!
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon role (prototype only)
CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON books FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON library FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON scans FOR ALL USING (true) WITH CHECK (true);
