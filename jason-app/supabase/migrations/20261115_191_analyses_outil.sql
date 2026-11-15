-- Audit express de la fiche Google, public et par lien (15/11/2026, Jason :
-- « la même chose pour /services/audit-gbp »). Le suivi de l'admin sert aux
-- deux outils : colonne outil ('airbnb' ou 'gbp') et libelle (nom public de
-- l'établissement pour une fiche Google). annonce_id porte le numéro de
-- l'annonce Airbnb ou l'identifiant de la fiche Google. Toujours rien sur le
-- visiteur. Rejouable.

alter table public.annonce_analyses
  add column if not exists outil text not null default 'airbnb',
  add column if not exists libelle text;

create index if not exists annonce_analyses_outil_created_idx on public.annonce_analyses (outil, created_at desc);

-- Les deux lectures de la carte admin prennent l'outil en paramètre. Les
-- anciennes signatures sont retirées pour éviter deux fonctions du même nom.
drop function if exists public.annonce_analyses_stats();
create or replace function public.annonce_analyses_stats(p_outil text default 'airbnb')
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
  where outil = p_outil
$$;
revoke all on function public.annonce_analyses_stats(text) from public, anon, authenticated;
grant execute on function public.annonce_analyses_stats(text) to service_role;

drop function if exists public.annonce_analyses_recentes(int);
create or replace function public.annonce_analyses_recentes(p_limit int default 20, p_outil text default 'airbnb')
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc), '[]'::jsonb)
  from (
    select created_at, score, complet, annonce_id, sections, libelle
    from public.annonce_analyses
    where outil = p_outil
    order by created_at desc
    limit least(greatest(coalesce(p_limit, 20), 1), 100)
  ) t
$$;
revoke all on function public.annonce_analyses_recentes(int, text) from public, anon, authenticated;
grant execute on function public.annonce_analyses_recentes(int, text) to service_role;
