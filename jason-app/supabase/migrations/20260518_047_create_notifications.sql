-- Notifications génériques pour le dashboard hôte.
--
-- Distinct de `chez_nous_notifications` (forum-spécifique) : cette table reçoit
-- les alertes contextuelles générées par le rules-engine côté serveur
-- (arrivées imminentes, plafonds fiscaux, synchros échouées, nouveaux guides…).
--
-- Le compteur unifié de la cloche Header sommera les non-lus des deux tables.
--
-- Dédup natif via `dedup_key` UNIQUE par (recipient_id, dedup_key) : permet
-- au rules-engine d'être idempotent (re-rouler la règle ne crée pas de doublon
-- pour le même événement, ex: "arrivee-J-1 pour le séjour 42").

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references auth.users(id) on delete cascade,
  -- Catégorie haute : 'sejour' | 'fiscal' | 'sync' | 'guide' | 'chez_nous' | 'system'
  category      text not null check (category in ('sejour','fiscal','sync','guide','chez_nous','system')),
  -- Type fin : 'arrivee_demain' | 'arrivee_J3' | 'plafond_micro_80' | 'plafond_micro_100' | 'sync_ical_failed' | 'guide_published' | 'cn_thread_activity' …
  type          text not null,
  title         text not null,
  body          text,
  cta_label     text,
  cta_href      text,
  severity      text not null default 'info' check (severity in ('info','warning','success','error')),
  -- Métadonnées contextuelles (ex: sejour_id, ca_cumule, plafond, etc.)
  metadata      jsonb default '{}'::jsonb,
  -- Clé de dédup unique par recipient pour idempotence du rules-engine
  dedup_key     text not null,
  read_at       timestamptz,
  created_at    timestamptz not null default now(),
  -- Optionnel : date d'expiration (auto-purge des vieilles notifs périmées)
  expires_at    timestamptz
);

-- Dédup : un même (recipient, dedup_key) ne peut exister qu'une fois
create unique index notifications_dedup_uq on public.notifications (recipient_id, dedup_key);

-- Index pour le fetch principal (par utilisateur, tri date desc)
create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

-- Index partiel sur les non-lus (utilisé par le compteur cloche)
create index notifications_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;

-- RLS : chaque utilisateur ne voit/modifie que ses propres notifications
alter table public.notifications enable row level security;

create policy notifications_select_own
  on public.notifications for select
  using (auth.uid() = recipient_id);

create policy notifications_update_own
  on public.notifications for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- L'INSERT vient toujours du rules-engine côté serveur (service role).
-- Pas de policy INSERT pour les users.
-- Le DELETE est réservé au service role également (purge des notifications
-- expirées par cron Vercel).

comment on table public.notifications is
  'Notifications contextuelles générées par le rules-engine. Dédupliquées via dedup_key. Voir lib/notifications/rules.ts.';
comment on column public.notifications.dedup_key is
  'Clé unique par recipient pour idempotence. Convention : <type>:<entity_id>[:<period>]. Ex: arrivee_demain:sejour_42, plafond_micro_80:2026';
