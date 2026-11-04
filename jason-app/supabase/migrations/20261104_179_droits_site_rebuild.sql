-- Droits de la table site_rebuild_state (migration 178) : le projet ne donne
-- plus d'office les droits aux nouvelles tables (voir migration-grants.test.ts).
-- Sans eux, l'app ne la lit pas et reconstruit le site tout de suite (comme avant).
grant select, insert, update, delete on table public.site_rebuild_state to service_role;
revoke all on table public.site_rebuild_state from anon, authenticated;
