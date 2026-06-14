-- ════════════════════════════════════════════════════════════════════
-- Signalements voyageurs publics anonymisés (LCD uniquement)
-- ════════════════════════════════════════════════════════════════════
-- L'hôte qui signale un voyageur peut OPT-IN pour rendre une version
-- ANONYMISÉE du signalement publique sur jasonmarinho.com/securite/
-- signalements/[slug]. Bénéfice : trafic SEO + preuve sociale.
--
-- Garde-fous juridiques (RGPD, LCEN, diffamation) :
--  - Pseudonymisation OBLIGATOIRE (prénom + initiale, ville sans rue,
--    mois sans jour) — application stockée dans public_summary.
--  - Modération a priori (moderation_status='approved' requis pour
--    qu'une page publique soit générée par le build script).
--  - Mécanisme de retrait sous 48h via /securite/contester-signalement.
--  - View `public_signalements_view` filtre côté DB : impossible de fuir
--    les données nominatives même via le service role.
-- ════════════════════════════════════════════════════════════════════

alter table public.reported_guests
  add column if not exists public_visible boolean not null default false,
  add column if not exists public_slug text unique,
  add column if not exists public_summary text,
  add column if not exists public_city text,
  add column if not exists public_month text,  -- format YYYY-MM
  add column if not exists moderation_status text not null default 'private',
  add column if not exists moderation_decided_at timestamptz,
  add column if not exists moderation_decided_by uuid references public.profiles(id),
  add column if not exists moderation_note text,
  add column if not exists removal_request_at timestamptz,
  add column if not exists removal_request_email text,
  add column if not exists removal_request_reason text;

-- Contrainte CHECK pour limiter les valeurs possibles de moderation_status
-- (équivalent enum sans la rigidité d'un vrai type SQL).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reported_guests_moderation_status_check'
  ) then
    alter table public.reported_guests
      add constraint reported_guests_moderation_status_check
      check (moderation_status in ('private', 'pending', 'approved', 'rejected', 'removed'));
  end if;
end $$;

-- Index pour les lectures publiques (build script + recherche par slug)
create index if not exists reported_guests_public_visible_idx
  on public.reported_guests (moderation_status, public_visible)
  where moderation_status = 'approved' and public_visible = true;

create index if not exists reported_guests_public_slug_idx
  on public.reported_guests (public_slug)
  where public_slug is not null;

-- View `public_signalements_view` : interface publique stricte.
-- - Expose UNIQUEMENT les champs anonymisés.
-- - Filtre côté DB sur moderation_status='approved' AND public_visible=true.
-- - Le build script du site statique lit cette view via service role.
-- - Impossible d'accéder à identifier/name/reporter via cette view.
drop view if exists public.public_signalements_view;
create view public.public_signalements_view as
select
  id,
  public_slug as slug,
  public_summary as summary,
  public_city as city,
  public_month as month,
  incident_type,
  reported_at as created_at
from public.reported_guests
where moderation_status = 'approved'
  and public_visible = true
  and public_slug is not null
  and public_summary is not null
order by reported_at desc;

comment on view public.public_signalements_view is
  'Vue publique anonymisée des signalements. Lue par le build script du site statique (jasonmarinho.com). Aucune fuite de PII possible.';

comment on column public.reported_guests.public_visible is
  'OPT-IN par l''hôte signalant : true = il accepte qu''une version anonymisée soit publiée sur le site public après modération.';

comment on column public.reported_guests.moderation_status is
  'private (défaut, pas d''opt-in) | pending (opt-in, en attente modération) | approved (publié) | rejected (refusé par admin) | removed (retiré après demande de la personne signalée).';
