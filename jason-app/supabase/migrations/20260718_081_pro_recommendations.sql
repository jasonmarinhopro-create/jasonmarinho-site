-- Recommandations d'hôtes pour les pros des annuaires (photographes / ménage).
-- Un hôte connecté peut recommander un pro avec qui il a travaillé ; le badge
-- « Recommandé par N hôtes » s'affiche sur la fiche publique au prochain build.

create table if not exists public.pro_recommendations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  pro_type   text not null check (pro_type in ('photographer', 'cleaner')),
  pro_id     uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, pro_type, pro_id)
);

create index if not exists pro_recommendations_pro_idx
  on public.pro_recommendations (pro_type, pro_id);

alter table public.pro_recommendations enable row level security;

drop policy if exists "pro_recommendations_select_own" on public.pro_recommendations;
create policy "pro_recommendations_select_own"
  on public.pro_recommendations for select using (auth.uid() = user_id);

drop policy if exists "pro_recommendations_insert_own" on public.pro_recommendations;
create policy "pro_recommendations_insert_own"
  on public.pro_recommendations for insert with check (auth.uid() = user_id);

drop policy if exists "pro_recommendations_delete_own" on public.pro_recommendations;
create policy "pro_recommendations_delete_own"
  on public.pro_recommendations for delete using (auth.uid() = user_id);
