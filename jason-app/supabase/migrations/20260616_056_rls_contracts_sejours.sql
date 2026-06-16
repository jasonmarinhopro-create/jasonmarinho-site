-- ════════════════════════════════════════════════════════════════════
-- RLS sur contracts + sejours (sécurisation critique des données money)
-- ════════════════════════════════════════════════════════════════════
-- Audit 2026-06 a révélé : RLS NON activée sur ces 2 tables critiques.
-- Conséquence : si une requête côté app oubliait un `.eq('user_id', ...)`,
-- un hôte authentifié pouvait potentiellement lire/modifier les contrats
-- et séjours d'autres hôtes.
--
-- Le code applicatif applique déjà les checks (defense in depth) mais on
-- ajoute la RLS comme dernier rempart. Service role bypass = inchangé,
-- les routes API critiques (sign, deposit/*, webhooks) continuent de
-- fonctionner.
--
-- Idempotent (if not exists / drop if exists) → safe à rejouer.
-- ════════════════════════════════════════════════════════════════════

-- ── CONTRACTS ──────────────────────────────────────────────────────
alter table public.contracts enable row level security;

-- Hôte propriétaire : lecture/écriture/suppression sur SES contrats uniquement
drop policy if exists "contracts_owner_select" on public.contracts;
create policy "contracts_owner_select"
  on public.contracts for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "contracts_owner_insert" on public.contracts;
create policy "contracts_owner_insert"
  on public.contracts for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "contracts_owner_update" on public.contracts;
create policy "contracts_owner_update"
  on public.contracts for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "contracts_owner_delete" on public.contracts;
create policy "contracts_owner_delete"
  on public.contracts for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ── SEJOURS ────────────────────────────────────────────────────────
alter table public.sejours enable row level security;

drop policy if exists "sejours_owner_select" on public.sejours;
create policy "sejours_owner_select"
  on public.sejours for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "sejours_owner_insert" on public.sejours;
create policy "sejours_owner_insert"
  on public.sejours for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "sejours_owner_update" on public.sejours;
create policy "sejours_owner_update"
  on public.sejours for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "sejours_owner_delete" on public.sejours;
create policy "sejours_owner_delete"
  on public.sejours for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ── Indexes performance RLS (si pas déjà créés) ────────────────────
-- Ces 2 tables sont fortement filtrées par user_id, un index dédié
-- évite un seq scan à chaque évaluation de policy.
create index if not exists contracts_user_id_idx on public.contracts (user_id);
create index if not exists sejours_user_id_idx on public.sejours (user_id);

comment on policy "contracts_owner_select" on public.contracts is
  'Un hôte authentifié ne voit que ses propres contrats. Service role bypass (utilisé par /api/contracts/sign sans session locataire).';

comment on policy "sejours_owner_select" on public.sejours is
  'Un hôte authentifié ne voit que ses propres séjours. Service role bypass.';
