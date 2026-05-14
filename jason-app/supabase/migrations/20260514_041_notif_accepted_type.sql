-- ─────────────────────────────────────────────────────────────────────
-- Migration : Notifications "accepted" + index unread agrégé
-- ─────────────────────────────────────────────────────────────────────
-- Permet de notifier l'auteur d'une réponse quand son post auteur la
-- marque comme "réponse acceptée". L'insert est fait depuis l'action
-- serveur acceptReply() (pas un trigger pour éviter les notifs lors
-- d'un toggle off).

-- Élargit le CHECK constraint pour accepter 'accepted'
alter table public.chez_nous_notifications
  drop constraint if exists chez_nous_notifications_type_check;

alter table public.chez_nous_notifications
  add constraint chez_nous_notifications_type_check
  check (type in ('reply', 'mention', 'accepted'));
