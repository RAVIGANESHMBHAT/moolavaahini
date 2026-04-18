-- ============================================================
-- 00001_schema.sql  –  Core tables, enums, triggers
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
create type public.user_role as enum ('user', 'contributor', 'admin');
create type public.post_status as enum ('draft', 'pending_review', 'approved', 'rejected');

-- ── Communities ──────────────────────────────────────────────
create table public.communities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- ── Categories ───────────────────────────────────────────────
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

-- ── Profiles (extends auth.users) ───────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  role         public.user_role not null default 'user',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Posts ────────────────────────────────────────────────────
create table public.posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  body             text not null default '',
  status           public.post_status not null default 'draft',
  community_id     uuid not null references public.communities(id) on delete restrict,
  category_id      uuid not null references public.categories(id) on delete restrict,
  author_id        uuid not null references public.profiles(id) on delete cascade,
  reviewer_id      uuid references public.profiles(id) on delete set null,
  rejection_reason text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  published_at     timestamptz,
  -- Full-text search vector (generated column)
  search_vector    tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored
);

-- ── Indexes ──────────────────────────────────────────────────
create index posts_community_id_idx   on public.posts(community_id);
create index posts_category_id_idx    on public.posts(category_id);
create index posts_author_id_idx      on public.posts(author_id);
create index posts_status_idx         on public.posts(status);
create index posts_published_at_idx   on public.posts(published_at desc nulls last);
create index posts_search_vector_idx  on public.posts using gin(search_vector);
create index posts_slug_idx           on public.posts(slug);

-- ── Trigger: updated_at maintenance ─────────────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.handle_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ── Trigger: auto-create profile on signup ──────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
