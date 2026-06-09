-- ════════════════════════════════════════════════════════════════════
-- Liens plateformes globaux par hôte (inbox messagerie, dashboards)
-- ════════════════════════════════════════════════════════════════════
-- Les colonnes lien_airbnb/booking sur logements pointent vers la FICHE
-- d'un logement spécifique. Pour l'usage "répondre aux messages", l'hôte
-- ouvre l'INBOX GLOBAL (1 par plateforme, peu importe le nombre de
-- listings). Stocké au niveau profile pour accès rapide depuis le
-- dashboard home.
--
-- custom_platform_links permet à l'hôte d'ajouter n'importe quelle
-- plateforme libre (Hospitable, Smoobu, sa propre conciergerie, etc.)
-- via une liste JSON ordonnée.
-- ════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists inbox_airbnb_url text,
  add column if not exists inbox_booking_url text,
  add column if not exists inbox_vrbo_url text,
  add column if not exists inbox_abritel_url text,
  add column if not exists inbox_driing_url text,
  add column if not exists custom_platform_links jsonb default '[]'::jsonb;

-- Format custom_platform_links :
-- [{ "label": "Hospitable", "url": "https://my.hospitable.com", "color"?: "#9333ea" }]
