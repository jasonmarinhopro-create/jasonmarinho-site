-- Demandes de page de ville (17/10/2026, Jason : « ce n'est pas la première
-- fois qu'on me le demande ») : garder une trace pour compter les demandes par
-- ville. Aucune donnée personnelle : la ville, le profil et la date. L'adresse
-- facultative de la personne ne part que dans l'e-mail à Jason.
create table if not exists public.city_requests (
  id uuid primary key default gen_random_uuid(),
  ville text not null,
  ville_key text not null,
  metier text not null check (metier in ('photographe', 'menage', 'hote')),
  created_at timestamptz not null default now()
);
create index if not exists city_requests_key_idx on public.city_requests (ville_key);
alter table public.city_requests enable row level security;
-- Pas de politique : service role seulement
