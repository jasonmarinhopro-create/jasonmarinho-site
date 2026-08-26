-- Conserve l'ID du conteneur média Instagram créé lorsqu'une publication
-- expire pendant l'attente de traitement (status_code=FINISHED jamais
-- atteint dans le délai imparti). Sans ça, chaque clic sur "Réessayer"
-- recréait un nouveau conteneur média et repartait de zéro pour l'attente,
-- alors qu'Instagram continue de traiter le premier en arrière-plan — d'où
-- l'échec répété observé sur le même post. Le prochain essai réutilise ce
-- conteneur (déjà probablement prêt) au lieu d'en recréer un.

alter table social_post_targets
  add column if not exists pending_media_id text default null;
