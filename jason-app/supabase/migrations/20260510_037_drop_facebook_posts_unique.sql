-- Permet plusieurs posts Facebook sauvegardés par utilisateur et par logement.
-- Au départ on limitait à 1 (index unique sur user_id + logement_id), mais
-- l'usage réel montre que les hôtes veulent plusieurs versions sauvegardées
-- (ex: "Présentation", "Dernière minute", "Été 2027"). On retire la
-- contrainte d'unicité.
DROP INDEX IF EXISTS public.user_facebook_posts_user_logement_unique;
