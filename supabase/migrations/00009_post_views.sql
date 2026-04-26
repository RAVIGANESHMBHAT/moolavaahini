-- ============================================================
-- 00009_post_views.sql
-- Track views for approved posts using daily aggregation.
-- One row per (post_id, date) with an incrementing count.
-- Much more space-efficient than one row per view event.
-- ============================================================

create table public.post_views (
  post_id  uuid not null references public.posts(id) on delete cascade,
  date     date not null default current_date,
  count    integer not null default 0,
  primary key (post_id, date)
);

create index on public.post_views (date);

-- RLS
alter table public.post_views enable row level security;

-- Anyone (including unauthenticated visitors) can record a view
create policy "Anyone can insert post views"
  on public.post_views for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can update post views"
  on public.post_views for update
  to anon, authenticated
  using (true);

-- Only authenticated users can read (admins query analytics)
create policy "Authenticated users can read post views"
  on public.post_views for select
  to authenticated
  using (true);

-- Function to atomically increment the daily view count
create or replace function public.increment_post_view(p_post_id uuid, p_date date)
returns void language sql security definer as $$
  insert into public.post_views (post_id, date, count)
  values (p_post_id, p_date, 1)
  on conflict (post_id, date)
  do update set count = public.post_views.count + 1;
$$;
