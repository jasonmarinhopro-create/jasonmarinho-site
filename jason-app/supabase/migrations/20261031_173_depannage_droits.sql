-- Dépannage : droits des tables (31/10/2026). Les tables créées par la
-- migration 170 n'ont reçu aucun droit de lecture ni d'écriture (le projet ne
-- les donne plus d'office aux nouvelles tables) : le build du site échouait sur
-- public_depannage_view (« permission denied ») et le client service ne pouvait
-- rien écrire. Même accès que le ménage : service complet, utilisateur connecté
-- limité par la RLS (sa propre fiche, ses propres demandes), rien pour anon.
-- Rejouable.

grant select, insert, update, delete on public.depannage_pros to service_role;
grant select, insert, update, delete on public.depannage_contacts to service_role;
grant select on public.public_depannage_view to service_role, anon, authenticated;

grant select, update on public.depannage_pros to authenticated;
grant select, update, delete on public.depannage_contacts to authenticated;
