-- ============================================================
-- 00005_pending_edits.sql  –  Pending revision columns for approved posts
-- ============================================================
-- Allows authors to draft edits to already-approved posts without
-- taking the approved version offline. The live title/body/community/category
-- remain unchanged until the pending edit is approved by a reviewer.

alter table public.posts
  add column pending_title        text,
  add column pending_body         text,
  add column pending_community_id uuid references public.communities(id),
  add column pending_category_id  uuid references public.categories(id),
  add column pending_submitted_at timestamptz;

-- Partial index: only rows that have a pending edit under review
create index posts_pending_submitted_at_idx
  on public.posts(pending_submitted_at)
  where pending_submitted_at is not null;
