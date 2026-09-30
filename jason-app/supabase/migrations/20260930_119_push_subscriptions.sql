-- Notifications sur le téléphone (Web Push), 30/09/2026.
-- Un abonnement par appareil (navigateur ou app installée). L'hôte gère ses
-- propres appareils (RLS) ; l'envoi passe par le service role
-- (lib/notifications/push.ts), qui supprime les abonnements expirés.

create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null unique,
  p256dh        text not null,
  auth          text not null,
  -- Libellé lisible de l'appareil (« iPhone », « Chrome sur Mac »…)
  device        text,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  failures      integer not null default 0
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_select_own on public.push_subscriptions;
create policy push_subscriptions_select_own on public.push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists push_subscriptions_insert_own on public.push_subscriptions;
create policy push_subscriptions_insert_own on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists push_subscriptions_update_own on public.push_subscriptions;
create policy push_subscriptions_update_own on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists push_subscriptions_delete_own on public.push_subscriptions;
create policy push_subscriptions_delete_own on public.push_subscriptions
  for delete using (auth.uid() = user_id);

comment on table public.push_subscriptions is
  'Abonnements Web Push par appareil. Voir lib/notifications/push.ts et public/sw.js.';
