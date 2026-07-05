-- ═══════════════════════════════════════════════════════════════════
-- Demandes reçues : pipeline de suivi pour les pros (photographes +
-- équipes ménage) dans leur dashboard.
--
-- Contexte : les formulaires de contact des fiches publiques insèrent
-- dans photographer_contacts / cleaner_contacts (service role). Les pros
-- doivent maintenant pouvoir consulter leurs demandes et suivre leur
-- avancement (répondu, devis envoyé, gagnée/perdue) depuis
-- /dashboard/ma-fiche-photographe et /dashboard/ma-fiche-menage.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Colonnes pipeline ─────────────────────────────────────────────
alter table public.photographer_contacts
  add column if not exists status text not null default 'nouvelle'
    check (status in ('nouvelle', 'repondue', 'devis_envoye', 'gagnee', 'perdue')),
  add column if not exists pro_notes text;

alter table public.cleaner_contacts
  add column if not exists status text not null default 'nouvelle'
    check (status in ('nouvelle', 'repondue', 'devis_envoye', 'gagnee', 'perdue')),
  add column if not exists pro_notes text;

-- ── 2. RLS : le pro lit et met à jour SES demandes ───────────────────
-- (RLS déjà activé sur les 2 tables, aucune policy n'existait → deny-all
-- hors service role. On ouvre uniquement au propriétaire de la fiche.)

drop policy if exists "Pros read own photographer contacts" on public.photographer_contacts;
create policy "Pros read own photographer contacts"
  on public.photographer_contacts
  for select
  to authenticated
  using (
    photographer_id in (
      select id from public.photographers where user_id = auth.uid()
    )
  );

drop policy if exists "Pros update own photographer contacts" on public.photographer_contacts;
create policy "Pros update own photographer contacts"
  on public.photographer_contacts
  for update
  to authenticated
  using (
    photographer_id in (
      select id from public.photographers where user_id = auth.uid()
    )
  )
  with check (
    photographer_id in (
      select id from public.photographers where user_id = auth.uid()
    )
  );

drop policy if exists "Pros read own cleaner contacts" on public.cleaner_contacts;
create policy "Pros read own cleaner contacts"
  on public.cleaner_contacts
  for select
  to authenticated
  using (
    cleaner_id in (
      select id from public.cleaners where user_id = auth.uid()
    )
  );

drop policy if exists "Pros update own cleaner contacts" on public.cleaner_contacts;
create policy "Pros update own cleaner contacts"
  on public.cleaner_contacts
  for update
  to authenticated
  using (
    cleaner_id in (
      select id from public.cleaners where user_id = auth.uid()
    )
  )
  with check (
    cleaner_id in (
      select id from public.cleaners where user_id = auth.uid()
    )
  );

-- ── 3. Index statut (filtre "nouvelles" du dashboard) ────────────────
create index if not exists photographer_contacts_status_idx
  on public.photographer_contacts (photographer_id, status);
create index if not exists cleaner_contacts_status_idx
  on public.cleaner_contacts (cleaner_id, status);
