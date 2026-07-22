-- Liens permanents pour QR codes imprimés : le QR encode une URL stable
-- (/q/<slug>) qui redirige vers `target_url`. L'hôte peut changer la
-- destination à tout moment depuis le dashboard sans jamais avoir à
-- réimprimer le QR code (contrairement à un QR code "URL directe" classique,
-- qui devient mort si l'URL cible change après impression).

create table if not exists public.qr_redirects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  logement_id uuid references public.logements(id) on delete set null,
  slug        text not null unique,
  label       text not null,
  target_url  text not null,
  click_count integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists qr_redirects_user_id_idx on public.qr_redirects (user_id);

alter table public.qr_redirects enable row level security;

-- Pas de policy SELECT publique : la résolution slug → target_url au moment
-- du scan passe par le service role côté serveur (route /q/[slug]), jamais
-- par le client anon. Seul le propriétaire peut lire/gérer ses liens.
drop policy if exists "qr_redirects_select_own" on public.qr_redirects;
create policy "qr_redirects_select_own"
  on public.qr_redirects for select using (auth.uid() = user_id);

drop policy if exists "qr_redirects_insert_own" on public.qr_redirects;
create policy "qr_redirects_insert_own"
  on public.qr_redirects for insert with check (auth.uid() = user_id);

drop policy if exists "qr_redirects_update_own" on public.qr_redirects;
create policy "qr_redirects_update_own"
  on public.qr_redirects for update using (auth.uid() = user_id);

drop policy if exists "qr_redirects_delete_own" on public.qr_redirects;
create policy "qr_redirects_delete_own"
  on public.qr_redirects for delete using (auth.uid() = user_id);
