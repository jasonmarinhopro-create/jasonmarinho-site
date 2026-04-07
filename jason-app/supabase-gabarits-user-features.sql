-- ============================================================
-- Migration : favoris + personnalisations de gabarits par utilisateur
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. Table des favoris utilisateur
create table if not exists public.user_template_favorites (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  template_id  uuid not null references public.templates(id) on delete cascade,
  created_at   timestamptz default now(),
  unique(user_id, template_id)
);

-- 2. Table des personnalisations utilisateur (« Ma version »)
create table if not exists public.user_template_customizations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  template_id  uuid not null references public.templates(id) on delete cascade,
  title        text not null,
  content      text not null,
  notes        text,                       -- notes privées de l'hôte
  timing_label text,                       -- 'avant-arrivee' | 'pendant-sejour' | 'apres-depart'
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(user_id, template_id)             -- une seule version personnalisée par gabarit
);

-- 3. Index
create index if not exists user_fav_user_idx    on public.user_template_favorites(user_id);
create index if not exists user_custom_user_idx on public.user_template_customizations(user_id);

-- 4. Row Level Security — favoris
alter table public.user_template_favorites enable row level security;

create policy "Favoris : lecture par l'utilisateur"
  on public.user_template_favorites for select
  using (auth.uid() = user_id);

create policy "Favoris : ajout par l'utilisateur"
  on public.user_template_favorites for insert
  with check (auth.uid() = user_id);

create policy "Favoris : suppression par l'utilisateur"
  on public.user_template_favorites for delete
  using (auth.uid() = user_id);

-- 5. Row Level Security — personnalisations
alter table public.user_template_customizations enable row level security;

create policy "Personnalisations : lecture par l'utilisateur"
  on public.user_template_customizations for select
  using (auth.uid() = user_id);

create policy "Personnalisations : ajout par l'utilisateur"
  on public.user_template_customizations for insert
  with check (auth.uid() = user_id);

create policy "Personnalisations : modification par l'utilisateur"
  on public.user_template_customizations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Personnalisations : suppression par l'utilisateur"
  on public.user_template_customizations for delete
  using (auth.uid() = user_id);

-- 6. Fonction trigger pour updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_template_customizations_updated_at
  before update on public.user_template_customizations
  for each row execute function public.set_updated_at();

-- 7. Fonction RPC pour incrémenter le compteur de copie
create or replace function public.increment_copy_count(template_id uuid)
returns void language sql security definer as $$
  update public.templates
  set copy_count = copy_count + 1
  where id = template_id;
$$;
