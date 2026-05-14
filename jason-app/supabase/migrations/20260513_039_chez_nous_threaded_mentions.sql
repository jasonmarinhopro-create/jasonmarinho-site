-- ─────────────────────────────────────────────────────────────────────
-- Chez Nous, threaded replies + mentions @nom
-- Date : 2026-05-13
-- ─────────────────────────────────────────────────────────────────────

-- ─── 1. Threaded replies ───────────────────────────────────────────────
-- Ajout d'un parent_reply_id sur chez_nous_replies pour permettre les
-- réponses à une réponse (1 niveau de threading, façon Facebook).

alter table public.chez_nous_replies
  add column if not exists parent_reply_id uuid
    references public.chez_nous_replies(id) on delete cascade;

create index if not exists chez_nous_replies_parent_idx
  on public.chez_nous_replies (parent_reply_id)
  where parent_reply_id is not null;

-- ─── 2. Notification quand on répond à un commentaire ─────────────────
-- On étend le trigger existant : si new.parent_reply_id est set, notifier
-- aussi l'auteur du commentaire parent (en plus de l'auteur du post).

create or replace function public.chez_nous_notify_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author    uuid;
  parent_author  uuid;
begin
  select author_id into post_author from public.chez_nous_posts where id = new.post_id;

  -- Notif à l'auteur du post (sauf si auto-réponse)
  if post_author is not null and post_author <> new.author_id then
    insert into public.chez_nous_notifications (recipient_id, actor_id, type, post_id, reply_id)
    values (post_author, new.author_id, 'reply', new.post_id, new.id);
  end if;

  -- Threaded : notif à l'auteur du commentaire parent (sauf si auto ou si
  -- c'est déjà l'auteur du post → on évite le doublon).
  if new.parent_reply_id is not null then
    select author_id into parent_author from public.chez_nous_replies where id = new.parent_reply_id;
    if parent_author is not null
       and parent_author <> new.author_id
       and parent_author <> post_author
    then
      insert into public.chez_nous_notifications (recipient_id, actor_id, type, post_id, reply_id)
      values (parent_author, new.author_id, 'reply', new.post_id, new.id);
    end if;
  end if;

  return null;
end;
$$;

-- ─── 3. Élargir le check sur type de notif ────────────────────────────
-- On va ajouter le type 'mention' dans la suite. On lève la contrainte
-- actuelle qui n'accepte que 'reply'.

alter table public.chez_nous_notifications
  drop constraint if exists chez_nous_notifications_type_check;

alter table public.chez_nous_notifications
  add constraint chez_nous_notifications_type_check
    check (type in ('reply', 'mention'));

-- ─── 4. Mentions @nom ──────────────────────────────────────────────────
-- Table pour stocker les mentions parsées par l'application au moment
-- du createPost / createReply. Le trigger ci-dessous crée automatiquement
-- une notif 'mention' pour le membre mentionné.

create table if not exists public.chez_nous_mentions (
  id                  uuid primary key default gen_random_uuid(),
  mentioned_user_id   uuid not null references auth.users(id) on delete cascade,
  actor_id            uuid not null references auth.users(id) on delete cascade,
  post_id             uuid references public.chez_nous_posts(id) on delete cascade,
  reply_id            uuid references public.chez_nous_replies(id) on delete cascade,
  created_at          timestamptz not null default now(),
  -- Au moins post_id OU reply_id doit être renseigné.
  constraint chez_nous_mentions_source_check
    check (post_id is not null or reply_id is not null)
);

create index if not exists chez_nous_mentions_mentioned_idx
  on public.chez_nous_mentions (mentioned_user_id, created_at desc);

-- Trigger : à chaque mention insérée, créer une notif (sauf si auto-mention)
create or replace function public.chez_nous_notify_mention()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_post_id uuid;
begin
  if new.mentioned_user_id = new.actor_id then
    return null;
  end if;

  -- Si la mention est dans une reply, on remonte le post_id
  resolved_post_id := new.post_id;
  if resolved_post_id is null and new.reply_id is not null then
    select post_id into resolved_post_id from public.chez_nous_replies where id = new.reply_id;
  end if;

  insert into public.chez_nous_notifications (recipient_id, actor_id, type, post_id, reply_id)
  values (new.mentioned_user_id, new.actor_id, 'mention', resolved_post_id, new.reply_id);

  return null;
end;
$$;

drop trigger if exists chez_nous_notify_on_mention on public.chez_nous_mentions;
create trigger chez_nous_notify_on_mention
  after insert on public.chez_nous_mentions
  for each row execute procedure public.chez_nous_notify_mention();

-- ─── RLS sur chez_nous_mentions ───────────────────────────────────────
alter table public.chez_nous_mentions enable row level security;

drop policy if exists "chez_nous_mentions_select_own" on public.chez_nous_mentions;
create policy "chez_nous_mentions_select_own"
  on public.chez_nous_mentions for select
  using (auth.uid() = mentioned_user_id or auth.uid() = actor_id);

drop policy if exists "chez_nous_mentions_insert_own" on public.chez_nous_mentions;
create policy "chez_nous_mentions_insert_own"
  on public.chez_nous_mentions for insert
  with check (auth.uid() = actor_id);
