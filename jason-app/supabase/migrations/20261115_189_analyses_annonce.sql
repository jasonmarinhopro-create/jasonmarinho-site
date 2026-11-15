-- Compteur des analyses d'annonce Airbnb (15/11/2026, demande de Jason :
-- « ajoute le compteur d'analyses dans l'admin »). Une ligne par analyse
-- réussie de /services/analyse-annonce-airbnb : la date, la note sur 100 et si
-- la lecture était complète. Ni lien, ni identifiant d'annonce, ni visiteur.
-- Écrite par la fonction du site (clé de service), lue par l'admin
-- (Visibilité) via annonce_analyses_stats(). Rejouable.

create table if not exists public.annonce_analyses (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  score smallint not null check (score between 0 and 100),
  complet boolean not null default true
);

create index if not exists annonce_analyses_created_at_idx on public.annonce_analyses (created_at desc);

alter table public.annonce_analyses enable row level security;
grant select, insert, update, delete on public.annonce_analyses to service_role;

-- Les chiffres de la carte admin en une lecture (compter dans la base).
create or replace function public.annonce_analyses_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total', count(*),
    'jours7', count(*) filter (where created_at > now() - interval '7 days'),
    'jours30', count(*) filter (where created_at > now() - interval '30 days'),
    'jours30_avant', count(*) filter (where created_at > now() - interval '60 days' and created_at <= now() - interval '30 days'),
    'note_moyenne30', round(avg(score) filter (where created_at > now() - interval '30 days')),
    'partielles30', count(*) filter (where created_at > now() - interval '30 days' and not complet),
    'derniere', max(created_at)
  )
  from public.annonce_analyses
$$;

revoke all on function public.annonce_analyses_stats() from public, anon, authenticated;
grant execute on function public.annonce_analyses_stats() to service_role;
