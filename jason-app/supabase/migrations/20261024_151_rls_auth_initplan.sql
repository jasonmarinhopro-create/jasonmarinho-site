-- Politiques RLS : auth.uid() évalué une fois par requête (24/10/2026, plan de
-- performance, avertissement « Auth RLS Initialization Plan » : 152 politiques).
-- `auth.uid() = user_id` est recalculé pour chaque ligne lue ;
-- `(select auth.uid()) = user_id` l'est une seule fois. Même valeur, mêmes
-- droits : seule l'écriture de l'appel change. Les rôles, la commande et le
-- mode (permissif ou restrictif) de chaque politique ne sont pas touchés
-- (ALTER POLICY ne modifie que USING et WITH CHECK).
--
-- La migration lit les politiques réelles de la base (y compris celles créées à
-- la main dans Supabase) au lieu d'une liste figée. Rejouable : une politique
-- déjà réécrite ne contient plus d'appel nu et n'est plus modifiée.
do $migration$
declare
  pol record;
  new_qual text;
  new_check text;
  pattern constant text := '(?<!SELECT )auth\.(uid|jwt|role)\(\)';
begin
  for pol in
    select schemaname, tablename, policyname, qual, with_check
      from pg_policies
     where schemaname = 'public'
       and (coalesce(qual, '') ~ pattern or coalesce(with_check, '') ~ pattern)
  loop
    new_qual := case when pol.qual is null then null
                     else regexp_replace(pol.qual, pattern, '(select auth.\1())', 'g') end;
    new_check := case when pol.with_check is null then null
                      else regexp_replace(pol.with_check, pattern, '(select auth.\1())', 'g') end;

    if new_qual is not null and new_check is not null then
      execute format('alter policy %I on %I.%I using (%s) with check (%s)', pol.policyname, pol.schemaname, pol.tablename, new_qual, new_check);
    elsif new_qual is not null then
      execute format('alter policy %I on %I.%I using (%s)', pol.policyname, pol.schemaname, pol.tablename, new_qual);
    else
      execute format('alter policy %I on %I.%I with check (%s)', pol.policyname, pol.schemaname, pol.tablename, new_check);
    end if;
  end loop;
end
$migration$;
