-- ════════════════════════════════════════════════════════════════════
-- Chez Nous : notifier les admins quand un nouveau post est créé
-- ════════════════════════════════════════════════════════════════════
-- Symptôme : un membre crée un post dans Chez Nous, aucune notification
-- n'est émise pour les admins → la cloche reste vide, l'admin découvre
-- le post 18h plus tard par hasard.
--
-- Cause : seul un trigger sur INSERT INTO chez_nous_replies existait
-- (notif à l'auteur du post). Aucun trigger sur INSERT INTO
-- chez_nous_posts.
--
-- Fix : trigger qui crée une chez_nous_notifications pour chaque admin
-- (sauf l'auteur, qui serait son propre destinataire) à chaque nouveau
-- post. Idempotent : ne touche pas aux notifs existantes.
-- ════════════════════════════════════════════════════════════════════

-- 1) Étendre le check sur le type pour autoriser 'post'
alter table public.chez_nous_notifications
  drop constraint if exists chez_nous_notifications_type_check;

alter table public.chez_nous_notifications
  add constraint chez_nous_notifications_type_check
    check (type in ('reply', 'mention', 'accepted', 'post'));

-- 2) Fonction : notifie tous les admins (role='admin') d'un nouveau post
create or replace function public.chez_nous_notify_new_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.chez_nous_notifications
    (recipient_id, actor_id, type, post_id)
  select p.id, new.author_id, 'post', new.id
  from public.profiles p
  where p.role = 'admin'
    and p.id <> new.author_id;
  return null;
end;
$$;

-- 3) Trigger : à chaque insert dans chez_nous_posts
drop trigger if exists chez_nous_notify_on_post on public.chez_nous_posts;
create trigger chez_nous_notify_on_post
  after insert on public.chez_nous_posts
  for each row execute procedure public.chez_nous_notify_new_post();

-- Vérification (manuel) : après application, créer un post test depuis un
-- compte non-admin doit générer une ligne dans chez_nous_notifications
-- pour chaque admin.
