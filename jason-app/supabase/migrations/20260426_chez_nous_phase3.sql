-- ─────────────────────────────────────────────────────────────────────
-- Migration : Chez Nous Phase 3, notifications
-- Date : 2026-04-26
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.chez_nous_notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id     uuid not null references auth.users(id) on delete cascade,
  type         text not null check (type in ('reply')),
  post_id      uuid references public.chez_nous_posts(id) on delete cascade,
  reply_id     uuid references public.chez_nous_replies(id) on delete cascade,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists chez_nous_notif_recipient_idx
  on public.chez_nous_notifications (recipient_id, created_at desc);

create index if not exists chez_nous_notif_unread_idx
  on public.chez_nous_notifications (recipient_id, read_at)
  where read_at is null;

-- ─── Trigger : créer une notif quand quelqu'un répond à un post ───
create or replace function public.chez_nous_notify_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.chez_nous_posts where id = new.post_id;
  -- Pas de notif si on répond à son propre post
  if post_author is not null and post_author <> new.author_id then
    insert into public.chez_nous_notifications (recipient_id, actor_id, type, post_id, reply_id)
    values (post_author, new.author_id, 'reply', new.post_id, new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists chez_nous_notify_on_reply on public.chez_nous_replies;
create trigger chez_nous_notify_on_reply
  after insert on public.chez_nous_replies
  for each row execute procedure public.chez_nous_notify_reply();

-- ─── RLS ───
alter table public.chez_nous_notifications enable row level security;

drop policy if exists "chez_nous_notif_select_own" on public.chez_nous_notifications;
create policy "chez_nous_notif_select_own"
  on public.chez_nous_notifications for select
  using (auth.uid() = recipient_id);

drop policy if exists "chez_nous_notif_update_own" on public.chez_nous_notifications;
create policy "chez_nous_notif_update_own"
  on public.chez_nous_notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

drop policy if exists "chez_nous_notif_delete_own" on public.chez_nous_notifications;
create policy "chez_nous_notif_delete_own"
  on public.chez_nous_notifications for delete
  using (auth.uid() = recipient_id);
