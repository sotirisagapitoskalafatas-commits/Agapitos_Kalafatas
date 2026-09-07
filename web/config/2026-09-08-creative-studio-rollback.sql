-- =============================================================================
-- 2026-09-08 — Atlas OS Creative Studio (rollback)
-- Reverses 2026-09-08-creative-studio.sql. Run only if you deliberately want
-- to remove the Creative Studio. Existing generated media objects in storage
-- are NOT deleted (storage objects are not removed by dropping the bucket).
-- =============================================================================

begin;

drop table if exists public.creative_runs;
drop table if exists public.creative_asset_variants;
drop table if exists public.creative_assets;
drop table if exists public.creative_campaigns;
drop table if exists public.brand_rule;

delete from storage.objects where bucket_id = 'creative-assets';
delete from storage.buckets where id = 'creative-assets';

commit;