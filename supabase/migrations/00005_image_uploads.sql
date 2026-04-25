-- ============================================================
-- 00005_image_uploads.sql  –  Track every uploaded image
-- ============================================================
--
-- Instead of scanning all post bodies at cleanup time (O(posts)),
-- we maintain a reference from each uploaded image to its post.
-- Cleanup then only queries rows where post_id IS NULL — O(orphaned).
--
-- Lifecycle:
--   upload       → INSERT (path, user_id, post_id = NULL)
--   post save    → UPDATE SET post_id = <id> WHERE path IN (images in body)
--   post delete  → ON DELETE SET NULL  (DB handles it, orphan picked up by cleanup job)
--   cleanup job  → SELECT WHERE post_id IS NULL AND uploaded_at < NOW() - 24h

create table public.image_uploads (
  path         text        primary key,           -- storage path: {user_id}/{uuid}.ext
  user_id      uuid        not null references auth.users on delete cascade,
  post_id      uuid        references public.posts(id) on delete set null,
  uploaded_at  timestamptz not null default now()
);

-- The cleanup job's query: orphaned rows older than the grace period
create index image_uploads_orphaned_idx
  on public.image_uploads(uploaded_at)
  where post_id is null;

-- ── RLS ──────────────────────────────────────────────────────

alter table public.image_uploads enable row level security;

-- All writes go through server actions using the service-role client,
-- which bypasses RLS. No policies needed for client access.
