-- ============================================================
-- 00012_admin_config.sql
-- Generic key-value config table for admin settings.
-- ============================================================

create table public.admin_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_config enable row level security;

-- Admin check is enforced in server actions; allow authenticated reads/writes
create policy "Authenticated users can read config"
  on public.admin_config for select
  to authenticated using (true);

create policy "Authenticated users can insert config"
  on public.admin_config for insert
  to authenticated with check (true);

create policy "Authenticated users can update config"
  on public.admin_config for update
  to authenticated using (true);

-- Seed default payout rates
insert into public.admin_config (key, value) values (
  'payout_rates',
  '{"ogatu": 1, "gaade": 1, "naati-aushadha": 5, "recipe": 5, "ritual": 5}'::jsonb
);
