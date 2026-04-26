-- ============================================================
-- 00007_rename_samagra_kannada.sql
-- Rename "General Kannada" community to "Samagra Kannada".
-- The FK on posts uses community id (not slug), so no post
-- data migration is needed.
-- ============================================================

update public.communities
set name = 'Samagra Kannada', slug = 'samagra-kannada'
where slug = 'general-kannada';
