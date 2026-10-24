-- Droits des tables créées par les migrations 155 et 156 (24/10/2026) : sur
-- ce projet, une table neuve ne donne plus SELECT/INSERT/UPDATE/DELETE à
-- service_role ni à authenticated (constaté : « permission denied for table
-- social_comments » avec la clé de service). La RLS reste le garde-fou pour
-- authenticated (politique admin sur social_comments, aucune sur social_settings).
grant select, insert, update, delete on public.social_comments to service_role;
grant select, insert, update, delete on public.social_comments to authenticated;
grant select, insert, update, delete on public.social_settings to service_role;
