-- ============================================================
-- 00008_verified_posts.sql
-- Add verification fields to posts.
-- Admins can mark approved naati-aushadha posts as verified
-- to signal content has been reviewed for accuracy.
-- ============================================================

alter table public.posts
  add column is_verified boolean not null default false,
  add column verified_at timestamptz,
  add column verified_by uuid references auth.users(id);
