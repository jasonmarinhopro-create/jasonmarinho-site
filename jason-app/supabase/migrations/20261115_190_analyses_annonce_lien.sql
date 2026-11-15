-- Analyses d'annonce : garder l'annonce analysée (15/11/2026, Jason : « savoir
-- quel lien a été utilisé pour regarder si mon outil est fiable »).
-- annonce_id : le numéro de l'annonce Airbnb (page publique), d'où l'on refait
-- le lien ; sections : les cinq sous-notes. Toujours rien sur le visiteur
-- (ni adresse IP, ni e-mail). La page publique et sa FAQ le disent. Rejouable.

alter table public.annonce_analyses
  add column if not exists annonce_id text,
  add column if not exists sections jsonb;

-- Les dernières analyses pour la carte admin, en une lecture.
create or replace function public.annonce_analyses_recentes(p_limit int default 20)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc), '[]'::jsonb)
  from (
    select created_at, score, complet, annonce_id, sections
    from public.annonce_analyses
    order by created_at desc
    limit least(greatest(coalesce(p_limit, 20), 1), 100)
  ) t
$$;

revoke all on function public.annonce_analyses_recentes(int) from public, anon, authenticated;
grant execute on function public.annonce_analyses_recentes(int) to service_role;
