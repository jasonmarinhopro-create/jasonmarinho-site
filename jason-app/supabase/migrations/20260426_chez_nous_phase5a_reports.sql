-- ─────────────────────────────────────────────────────────────────────
-- Migration : Chez Nous Phase 5a, Signalements
-- Date : 2026-04-26
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.chez_nous_reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references auth.users(id) on delete cascade,
  post_id      uuid references public.chez_nous_posts(id) on delete cascade,
  reply_id     uuid references public.chez_nous_replies(id) on delete cascade,
  reason       text not null check (reason in ('off_topic', 'spam', 'aggressive', 'other')),
  message      text,
  resolved_at  timestamptz,
  resolved_by  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  -- Au moins un parmi post_id/reply_id doit être renseigné
  constraint chez_nous_reports_target check (post_id is not null or reply_id is not null)
);

create index if not exists chez_nous_reports_pending_idx
  on public.chez_nous_reports (created_at desc)
  where resolved_at is null;

create index if not exists chez_nous_reports_reporter_idx
  on public.chez_nous_reports (reporter_id, created_at desc);

-- ─── RLS ───
alter table public.chez_nous_reports enable row level security;

-- Le user peut signaler (insert), voir ses propres signalements
drop policy if exists "chez_nous_reports_insert_own" on public.chez_nous_reports;
create policy "chez_nous_reports_insert_own"
  on public.chez_nous_reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "chez_nous_reports_select_own" on public.chez_nous_reports;
create policy "chez_nous_reports_select_own"
  on public.chez_nous_reports for select
  using (
    auth.uid() = reporter_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- L'admin peut résoudre
drop policy if exists "chez_nous_reports_update_admin" on public.chez_nous_reports;
create policy "chez_nous_reports_update_admin"
  on public.chez_nous_reports for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
