-- ════════════════════════════════════════════════════════════════════
-- Security hardening : règle les warnings restants des advisors
-- Supabase (search_path, RLS roadmap, bucket listing, trigger exposure)
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Fige le search_path des fonctions exposées ──────────────────
-- Empêche un attaquant de manipuler le search_path de sa session pour
-- détourner une fonction SECURITY DEFINER vers ses propres tables.
-- Recommandation Supabase : SET search_path = public, pg_catalog.
alter function public.is_admin()                       set search_path = public, pg_catalog;
alter function public.set_updated_at()                 set search_path = public, pg_catalog;
alter function public.increment_copy_count(uuid)       set search_path = public, pg_catalog;
alter function public.update_blog_updated_at()         set search_path = public, pg_catalog;
alter function public.increment_idea_votes(uuid)       set search_path = public, pg_catalog;
alter function public.update_contracts_updated_at()    set search_path = public, pg_catalog;
alter function public.handle_new_user()                set search_path = public, pg_catalog;

-- ─── 2. RLS roadmap_items : restreint à l'author (+ admin) ─────────
-- Avant : tout authentifié peut INSERT/UPDATE/DELETE n'importe quel item.
-- Après : seul l'author peut INSERT son propre item ; UPDATE/DELETE
-- réservés à l'author OU à un admin (server actions admin restent
-- fonctionnelles via la session admin sans passer par service role).
--
-- L'admin est identifié via profiles.role = 'admin' (jointure inline,
-- pas de dépendance à une fonction is_admin externe).
drop policy if exists "roadmap_items_insert" on public.roadmap_items;
create policy "roadmap_items_insert" on public.roadmap_items
  for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists "roadmap_items_update" on public.roadmap_items;
create policy "roadmap_items_update" on public.roadmap_items
  for update to authenticated
  using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "roadmap_items_delete" on public.roadmap_items;
create policy "roadmap_items_delete" on public.roadmap_items
  for delete to authenticated
  using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ─── 3. RLS roadmap_comments_insert : author_id = auth.uid() ────────
-- Avant : with check (true) — n'importe qui pouvait poster avec
-- n'importe quel author_id.
drop policy if exists "roadmap_comments_insert" on public.roadmap_comments;
create policy "roadmap_comments_insert" on public.roadmap_comments
  for insert to authenticated
  with check (author_id = auth.uid());

-- ─── 4. Bucket chez-nous-images : retire le SELECT broad ────────────
-- Le bucket est marqué public → les URLs des objets sont accessibles
-- directement sans policy. La SELECT policy permettait juste de LISTER
-- tous les fichiers du bucket, ce qui n'a pas d'intérêt fonctionnel
-- et expose plus que nécessaire. Les images restent affichables par
-- URL directe (storage/v1/object/public/chez-nous-images/…).
drop policy if exists "chez_nous_images_public_read" on storage.objects;

-- ─── 5. Trigger functions : revoke EXECUTE des roles publics ─────────
-- Ces fonctions sont déclenchées par les TRIGGERS Postgres uniquement,
-- elles n'ont pas vocation à être appelées en RPC. Les triggers
-- continuent à fonctionner (ils tournent en tant que postgres super-user).
revoke execute on function public.chez_nous_notify_mention()           from anon, authenticated;
revoke execute on function public.chez_nous_notify_new_post()          from anon, authenticated;
revoke execute on function public.chez_nous_notify_reply()             from anon, authenticated;
revoke execute on function public.chez_nous_update_post_stats()        from anon, authenticated;
revoke execute on function public.chez_nous_update_post_votes()        from anon, authenticated;
revoke execute on function public.handle_new_user()                    from anon, authenticated;

-- ─── Notes sur les warnings restants intentionnels ──────────────────
-- - public.sign_contract(...) : RPC volontairement exposé pour la
--   signature de contrat via token (page /sign/[token] sans auth).
--   Reste SECURITY DEFINER avec EXECUTE à anon, par design.
-- - public.increment_copy_count, public.increment_idea_votes :
--   RPCs compteurs publics qui doivent bypass RLS. Par design.
-- - public.is_admin() : fonction de vérification utilisée par les RLS
--   policies. EXECUTE conservé.
