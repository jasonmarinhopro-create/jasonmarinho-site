-- ════════════════════════════════════════════════════════════════════
-- Hint identifiant partiel pour signalements publics anonymisés
-- ════════════════════════════════════════════════════════════════════
-- Aide les hôtes à reconnaître un arnaqueur récidiviste : si le même
-- voyageur tente sa chance ailleurs avec le même numéro/email, le hint
-- partiel permet la corrélation visuelle sans tomber sous le coup de
-- la diffamation (les 4 premiers chiffres ou 2 premières lettres ne
-- permettent pas l'identification d'un individu — pseudonymisation
-- CNIL conforme).
--
-- Format des hints :
--  phone  → "06 78 ●● ●● ●●"           (4 chiffres visibles, 8 masqués)
--  email  → "ma***@gmail.com"          (2 chars + masque + domaine)
--  name   → "Marie D."                 (prénom + initiale du nom)
--
-- Le hint est généré CÔTÉ SERVEUR à l'approbation modération (cf.
-- moderation-actions.ts maskIdentifier()). La logique est centralisée
-- pour éviter qu'un hôte balance des infos identifiantes par erreur
-- dans le résumé.
-- ════════════════════════════════════════════════════════════════════

alter table public.reported_guests
  add column if not exists public_identifier_hint text;

comment on column public.reported_guests.public_identifier_hint is
  'Hint identifiant partiel anonymisé généré à l''approbation. Format selon identifier_type : phone → 4 premiers chiffres masqués ; email → 2 premières lettres + domaine ; name → prénom + initiale.';

-- Recréation de la view publique pour inclure le hint
drop view if exists public.public_signalements_view;
create view public.public_signalements_view as
select
  id,
  public_slug as slug,
  public_summary as summary,
  public_city as city,
  public_month as month,
  public_identifier_hint as identifier_hint,
  incident_type,
  reported_at as created_at
from public.reported_guests
where moderation_status = 'approved'
  and public_visible = true
  and public_slug is not null
  and public_summary is not null
order by reported_at desc;

comment on view public.public_signalements_view is
  'Vue publique anonymisée des signalements. Lue par le build script du site statique (jasonmarinho.com). Inclut un hint identifiant partiel pour aider à la corrélation visuelle (anti-récidive) sans identifier la personne.';
