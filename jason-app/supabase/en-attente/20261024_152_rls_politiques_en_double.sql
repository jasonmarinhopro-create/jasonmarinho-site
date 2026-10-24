-- Politiques RLS qui se chevauchent (24/10/2026, plan de performance,
-- avertissement « Multiple Permissive Policies »). Quand plusieurs politiques
-- permissives couvrent la même action, Postgres les évalue toutes pour chaque
-- ligne. Ici, seulement des cas où les droits restent strictement identiques :
--
-- 1. Doublons exacts (même condition, rôle déjà couvert) : supprimés.
--    - contracts « Hôte gère ses contrats » (= contracts_owner_*)
--    - sejours « Users manage own sejours » (= sejours_owner_*)
--    - revenus_objectifs « revenus_objectifs_select_own » (= revenus_objectifs_upsert_own)
--    - actualites « authenticated read published actualites » (= « Public can read published actualites »)
--    - formation_modules « Read published formation modules » (déjà couverte par « Public read formation_modules », condition true)
-- 2. Admin + propriétaire fusionnés en une politique « propriétaire ou admin » :
--    sejours et voyageurs (l'admin gardait le même accès complet).
--
-- Chaque suppression vérifie d'abord la définition attendue (forme d'après la
-- migration 151) ; si une politique a changé, elle est laissée telle quelle.
-- Rejouable : une politique déjà supprimée ou fusionnée est ignorée.
do $migration$
declare
  q text;
  c text;
  ok boolean;
begin
  -- Politiques à supprimer et leur définition attendue (comparée sans
  -- parenthèses ni espaces, appel auth.uid() enveloppé ou non)
  create temp table if not exists _jm_expect (t text, p text, cmd text, qual text, chk text) on commit drop;
  truncate _jm_expect;
  insert into _jm_expect values
    ('contracts', 'Hôte gère ses contrats', 'ALL', 'auth.uid() = user_id', null),
    ('sejours', 'Users manage own sejours', 'ALL', 'auth.uid() = user_id', 'auth.uid() = user_id'),
    ('revenus_objectifs', 'revenus_objectifs_select_own', 'SELECT', 'auth.uid() = user_id', null),
    ('actualites', 'authenticated read published actualites', 'SELECT', 'is_published = true', null),
    ('formation_modules', 'Read published formation modules', 'SELECT', null, null);

  for q, c, ok in
    select e.p, e.t,
           exists (select 1 from pg_policies pp
                    where pp.schemaname = 'public' and pp.tablename = e.t and pp.policyname = e.p and pp.cmd = e.cmd
                      and (e.qual is null or lower(regexp_replace(regexp_replace(coalesce(pp.qual, ''), '\( SELECT (auth\.uid|is_admin)\(\) AS (uid|is_admin)\)', '\1()', 'g'), '[\s()]', '', 'g'))
                                           = lower(regexp_replace(e.qual, '[\s()]', '', 'g')))
                      and (e.chk is null or lower(regexp_replace(regexp_replace(coalesce(pp.with_check, ''), '\( SELECT (auth\.uid|is_admin)\(\) AS (uid|is_admin)\)', '\1()', 'g'), '[\s()]', '', 'g'))
                                          = lower(regexp_replace(e.chk, '[\s()]', '', 'g'))))
      from _jm_expect e
  loop
    if ok then
      execute format('drop policy %I on public.%I', q, c);
    elsif exists (select 1 from pg_policies where schemaname = 'public' and tablename = c and policyname = q) then
      raise notice 'Politique % sur % modifiée depuis : laissée telle quelle', q, c;
    end if;
  end loop;

  -- La couverture « Public read formation_modules » (condition true) doit rester
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'formation_modules' and policyname = 'Public read formation_modules' and qual = 'true') then
    raise exception 'formation_modules : la politique de lecture publique attendue manque';
  end if;
end
$migration$;

-- Séjours : propriétaire ou admin, une politique par action (au lieu de « Admin all sejours » en plus)
do $migration$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sejours' and policyname = 'Admin all sejours' and cmd = 'ALL' and qual = 'is_admin()' and with_check is null)
     and (select count(*) from pg_policies where schemaname = 'public' and tablename = 'sejours' and policyname in ('sejours_owner_select', 'sejours_owner_insert', 'sejours_owner_update', 'sejours_owner_delete')) = 4 then
    alter policy sejours_owner_select on public.sejours using (user_id = (select auth.uid()) or (select is_admin()));
    alter policy sejours_owner_delete on public.sejours using (user_id = (select auth.uid()) or (select is_admin()));
    alter policy sejours_owner_insert on public.sejours with check (user_id = (select auth.uid()) or (select is_admin()));
    alter policy sejours_owner_update on public.sejours using (user_id = (select auth.uid()) or (select is_admin()))
      with check (user_id = (select auth.uid()) or (select is_admin()));
    drop policy "Admin all sejours" on public.sejours;
  end if;
end
$migration$;

-- Voyageurs : une seule politique « propriétaire ou admin »
do $migration$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'voyageurs' and policyname = 'Admin all voyageurs' and cmd = 'ALL' and qual = 'is_admin()' and with_check is null)
     and exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'voyageurs' and policyname = 'Users manage own voyageurs' and cmd = 'ALL') then
    alter policy "Users manage own voyageurs" on public.voyageurs
      using (user_id = (select auth.uid()) or (select is_admin()))
      with check (user_id = (select auth.uid()) or (select is_admin()));
    drop policy "Admin all voyageurs" on public.voyageurs;
  end if;
end
$migration$;
