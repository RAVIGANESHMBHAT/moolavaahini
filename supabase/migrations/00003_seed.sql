-- ============================================================
-- 00003_seed.sql  –  Seed communities and categories
-- ============================================================

insert into public.communities (name, slug, description) values
  ('Havyaka',         'havyaka',         'Cultural content from the Havyaka Brahmin community of Karnataka'),
  ('General Kannada', 'general-kannada', 'General Kannada culture, traditions, and heritage')
on conflict (slug) do nothing;

insert into public.categories (name, slug) values
  ('Ogatu',          'ogatu'),
  ('Gaade',          'gaade'),
  ('Mane Maddu',     'mane-maddu'),
  ('Annapana',       'recipe'),
  ('Aacharane',       'ritual'),
  ('Gida Moolikegalu', 'gida-moolikegalu')
on conflict (slug) do nothing;
