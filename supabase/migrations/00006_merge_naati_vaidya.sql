-- ============================================================
-- 00006_merge_naati_aushadha.sql
-- Merge 'mane-maddu' and 'gida-moolikegalu' into a single
-- 'naati-aushadha' (Natural Healing) category.
-- ============================================================

-- 1. Insert the new combined category
insert into public.categories (name, slug, icon)
values ('Naati Aushadha', 'naati-aushadha', '🌿')
on conflict (slug) do nothing;

-- 2. Migrate all posts from both old categories to the new one
update public.posts
set category_id = (select id from public.categories where slug = 'naati-aushadha')
where category_id in (
  select id from public.categories where slug in ('mane-maddu', 'gida-moolikegalu')
);

-- 3. Remove the old categories
delete from public.categories where slug in ('mane-maddu', 'gida-moolikegalu');
