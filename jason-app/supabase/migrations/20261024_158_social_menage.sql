-- Réseaux sociaux, ménage (24/10/2026) :
-- 1. Commentaire de test interne du community manager (aucun vrai commentaire).
-- 2. Anciens messages privés par mot-clé (« Réponses auto ») désactivés : l'onglet
--    est retiré, les réponses passent désormais en public sous chaque commentaire.
delete from public.social_comments where comment_id = 'test-routine-cm-1';
update public.social_comment_triggers set active = false where active;
