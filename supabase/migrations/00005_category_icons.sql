-- ============================================================
-- 00005_category_icons.sql  –  Add icon column to categories
-- ============================================================

alter table public.categories add column if not exists icon text;

update public.categories set icon = '📖' where slug = 'ogatu';
update public.categories set icon = '💬' where slug = 'gaade';
update public.categories set icon = '🌿' where slug = 'mane-maddu';
update public.categories set icon = '🍽️' where slug = 'recipe';
update public.categories set icon = '🪔' where slug = 'ritual';
update public.categories set icon = '🌱' where slug = 'gida-moolikegalu';
