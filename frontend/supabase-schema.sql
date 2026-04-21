-- ═══════════════════════════════════════════
-- The Daily Grind — Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════

-- 1. Users (nickname-based, no passwords)
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  nickname text unique not null,
  theme_preference text default 'espresso',
  reading_goal int,
  created_at timestamptz default now()
);

-- 2. Books (normalized — deduplicated across all users)
create table if not exists books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  authors text,
  cover_url text,
  cover_fallback text,
  description text,
  published_date text,
  page_count int,
  categories text[] default '{}',
  sub_genres text[] default '{}',
  info_link text,
  amazon_url text,
  isbn text,
  created_at timestamptz default now(),
  -- Prevent exact duplicates
  unique(title, authors)
);

-- 3. Library (user's personal book collection)
create table if not exists library (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  book_id uuid references books(id) on delete cascade not null,
  status text default 'tbr' check (status in ('tbr', 'reading', 'read')),
  rating int check (rating >= 0 and rating <= 5) default 0,
  notes text,
  added_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- One entry per user per book
  unique(user_id, book_id)
);

-- 4. Scans (track OCR usage for improving accuracy over time)
create table if not exists scans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete set null,
  ocr_text text,
  query_used text,
  matched_book_id uuid references books(id) on delete set null,
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════
-- Row Level Security (RLS)
-- Allows the anon key to be used safely in frontend
-- ═══════════════════════════════════════════

alter table users enable row level security;
alter table books enable row level security;
alter table library enable row level security;
alter table scans enable row level security;

-- Users: anyone can create or read (it's just nicknames)
create policy "Anyone can read users" on users for select using (true);
create policy "Anyone can create users" on users for insert with check (true);
create policy "Users can update own record" on users for update using (true);

-- Books: anyone can read or create (shared catalog)
create policy "Anyone can read books" on books for select using (true);
create policy "Anyone can create books" on books for insert with check (true);

-- Library: anyone can CRUD (in a friends prototype, trust is assumed)
create policy "Anyone can read library" on library for select using (true);
create policy "Anyone can add to library" on library for insert with check (true);
create policy "Anyone can update library" on library for update using (true);
create policy "Anyone can remove from library" on library for delete using (true);

-- Scans: anyone can create and read
create policy "Anyone can read scans" on scans for select using (true);
create policy "Anyone can create scans" on scans for insert with check (true);

-- ═══════════════════════════════════════════
-- Indexes for performance
-- ═══════════════════════════════════════════

create index if not exists idx_library_user on library(user_id);
create index if not exists idx_library_book on library(book_id);
create index if not exists idx_books_title on books(title);
create index if not exists idx_books_isbn on books(isbn);
create index if not exists idx_users_nickname on users(nickname);
