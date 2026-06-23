-- ════════════════════════════════════════════════════════════════════
-- Annuaires pros : intégration Supabase Auth + rôles + RLS dédiées
-- ════════════════════════════════════════════════════════════════════
-- Passe les annuaires (photographes + ménage) en self-service avec
-- vrai compte Supabase Auth.
--
-- Avant : ligne dans `photographers` / `cleaners` sans lien auth, gestion
--   uniquement par l'admin.
-- Après : chaque pro crée son compte Supabase Auth au signup, sa fiche
--   est liée par user_id, il accède à un dashboard dédié
--   (/dashboard/ma-fiche-photographe ou /dashboard/ma-fiche-menage) pour
--   éditer son profil et gérer son abonnement Stripe.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Étend les rôles profiles ───────────────────────────────────
-- La colonne `profiles.role` est un text NOT NULL DEFAULT 'user' sans
-- contrainte CHECK. Les nouvelles valeurs 'photographer' et 'cleaner'
-- sont juste ajoutées sémantiquement, pas besoin de modifier la table.
-- On documente juste les valeurs valides.
comment on column public.profiles.role is
  'Rôle utilisateur. Valeurs : user (hôte LCD, défaut), admin (Jason), photographer (membre annuaire photo), cleaner (membre annuaire ménage).';

-- ── 2. Lien user_id sur photographers ─────────────────────────────
alter table public.photographers
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists photographers_user_id_unique_idx
  on public.photographers (user_id)
  where user_id is not null;

-- ── 3. Lien user_id sur cleaners ──────────────────────────────────
alter table public.cleaners
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists cleaners_user_id_unique_idx
  on public.cleaners (user_id)
  where user_id is not null;

-- ── 4. RLS : un pro lit sa propre fiche ────────────────────────────
-- Les serverless functions + actions admin passent toujours par service
-- role qui bypasse RLS. Ces policies servent uniquement au dashboard
-- Next.js qui utilise la session utilisateur.

drop policy if exists "Pros read own photographer row" on public.photographers;
create policy "Pros read own photographer row"
  on public.photographers
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Pros update own photographer row" on public.photographers;
create policy "Pros update own photographer row"
  on public.photographers
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Pros read own cleaner row" on public.cleaners;
create policy "Pros read own cleaner row"
  on public.cleaners
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Pros update own cleaner row" on public.cleaners;
create policy "Pros update own cleaner row"
  on public.cleaners
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── 5. RLS contacts : un pro lit ses propres demandes ─────────────
drop policy if exists "Pros read own photographer contacts" on public.photographer_contacts;
create policy "Pros read own photographer contacts"
  on public.photographer_contacts
  for select
  to authenticated
  using (
    exists (
      select 1 from public.photographers p
      where p.id = photographer_contacts.photographer_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "Pros read own cleaner contacts" on public.cleaner_contacts;
create policy "Pros read own cleaner contacts"
  on public.cleaner_contacts
  for select
  to authenticated
  using (
    exists (
      select 1 from public.cleaners c
      where c.id = cleaner_contacts.cleaner_id
        and c.user_id = auth.uid()
    )
  );

-- ── 6. Champs de protection contre la modification de l'email ─────
-- L'email est la clé d'identité Auth, il ne doit pas être modifié via
-- l'UPDATE policy. On vérifie cela côté server action (lib/queries) :
-- le pro ne peut UPDATE que les colonnes non-clés. RLS ne gère pas
-- le grain colonne, donc cette restriction est applicative.
