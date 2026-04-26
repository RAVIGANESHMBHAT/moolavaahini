-- ============================================================
-- 00011_payouts_rates_config.sql
-- Add per-category rates snapshot to contributor_payments.
-- rate_per_post becomes nullable (replaced by rates_config).
-- ============================================================

alter table public.contributor_payments
  add column rates_config jsonb,
  alter column rate_per_post drop not null;
