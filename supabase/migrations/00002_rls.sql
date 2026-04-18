-- ============================================================
-- 00002_rls.sql  –  Row Level Security policies
-- ============================================================

-- Enable RLS on all user-facing tables
alter table public.communities  enable row level security;
alter table public.categories   enable row level security;
alter table public.profiles     enable row level security;
alter table public.posts        enable row level security;

-- ── Helper: get current user's role ─────────────────────────
create or replace function public.get_my_role()
returns public.user_role
language sql
stable security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- COMMUNITIES
-- ============================================================

-- Public read
create policy "communities_select_public"
  on public.communities for select
  using (true);

-- Admin-only write
create policy "communities_insert_admin"
  on public.communities for insert
  with check (public.get_my_role() = 'admin');

create policy "communities_update_admin"
  on public.communities for update
  using (public.get_my_role() = 'admin');

create policy "communities_delete_admin"
  on public.communities for delete
  using (public.get_my_role() = 'admin');

-- ============================================================
-- CATEGORIES
-- ============================================================

create policy "categories_select_public"
  on public.categories for select
  using (true);

create policy "categories_insert_admin"
  on public.categories for insert
  with check (public.get_my_role() = 'admin');

create policy "categories_update_admin"
  on public.categories for update
  using (public.get_my_role() = 'admin');

create policy "categories_delete_admin"
  on public.categories for delete
  using (public.get_my_role() = 'admin');

-- ============================================================
-- PROFILES
-- ============================================================

-- Anyone can read profiles (needed to show author names)
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

-- Users can only update their own profile (name, avatar)
-- Role changes are only done via service-role client (bypasses RLS)
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- Prevent role self-escalation: role must stay the same unless admin
    and (role = (select role from public.profiles where id = auth.uid()) or public.get_my_role() = 'admin')
  );

-- ============================================================
-- POSTS
-- ============================================================

-- SELECT:
--   Approved posts are public
--   Authors can see their own posts in any status
--   Contributors and admins see everything
create policy "posts_select"
  on public.posts for select
  using (
    status = 'approved'
    or author_id = auth.uid()
    or public.get_my_role() in ('contributor', 'admin')
  );

-- INSERT: authenticated users only; status must be 'draft'
create policy "posts_insert_authenticated"
  on public.posts for insert
  with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and status = 'draft'
  );

-- UPDATE: authors can edit own draft/rejected/approved posts and submit for review (→ pending_review)
--         contributors/admins can update any field
create policy "posts_update_author"
  on public.posts for update
  using (
    (author_id = auth.uid() and status in ('draft', 'rejected', 'approved', 'pending_review'))
    or public.get_my_role() in ('contributor', 'admin')
  )
  with check (
    -- Authors can save edits or re-queue approved posts for review (→ pending_review)
    (author_id = auth.uid() and status in ('draft', 'rejected', 'pending_review', 'approved'))
    or public.get_my_role() in ('contributor', 'admin')
  );

-- DELETE: authors can delete their own posts at any status; admins can delete anything
create policy "posts_delete"
  on public.posts for delete
  using (
    author_id = auth.uid()
    or public.get_my_role() = 'admin'
  );
