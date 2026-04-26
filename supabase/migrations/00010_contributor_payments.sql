-- ============================================================
-- 00010_contributor_payments.sql
-- Track per-contributor payout status per month.
-- One row per (contributor, month). Snapshots post_count,
-- rate, and amount at payment time for historical accuracy.
-- ============================================================

create table public.contributor_payments (
  id              uuid primary key default gen_random_uuid(),
  contributor_id  uuid not null references auth.users(id) on delete cascade,
  month           date not null,  -- stored as YYYY-MM-01 (first day of month)
  post_count      integer not null,
  rate_per_post   numeric(10, 2) not null,
  amount          numeric(10, 2) not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'paid')),
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (contributor_id, month)
);

create index on public.contributor_payments (month);
create index on public.contributor_payments (contributor_id);

alter table public.contributor_payments enable row level security;

-- Only authenticated users (admins, guarded in server actions) can access
create policy "Authenticated users can manage contributor payments"
  on public.contributor_payments for all
  to authenticated
  using (true)
  with check (true);
