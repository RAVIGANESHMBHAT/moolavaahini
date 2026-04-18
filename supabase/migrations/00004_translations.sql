-- ============================================================
-- 00004_translations.sql  –  AI translation cache
-- ============================================================

create table public.post_translations (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.posts(id) on delete cascade,
  language   text        not null check (language in ('en')),
  title      text        not null,
  body       text        not null,
  created_at timestamptz not null default now(),

  -- One cached translation per (post, language) pair
  unique (post_id, language)
);

-- Index for the most common lookup: fetch by post_id + language
create index post_translations_post_id_language_idx
  on public.post_translations(post_id, language);

-- ── RLS ──────────────────────────────────────────────────────

alter table public.post_translations enable row level security;

-- Public read: anyone can read a cached translation
create policy "translations_select_public"
  on public.post_translations for select
  using (true);

-- No INSERT/UPDATE/DELETE policies for authenticated users.
-- All writes go through the service-role client in translate.actions.ts
-- which bypasses RLS entirely.
