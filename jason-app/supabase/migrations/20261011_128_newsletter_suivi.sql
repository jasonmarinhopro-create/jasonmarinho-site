-- Suivi de la newsletter « Le Check-in » (11/10/2026, demande de Jason : savoir
-- qui reçoit quoi, voir le contenu et les statistiques dans Provenance).
-- 1. Choix fait à l'inscription (case « Je veux recevoir les conseils… »),
--    gardé sur le compte : avant, il n'était envoyé qu'à Brevo.
-- 2. Contenu et destinataires de chaque lettre envoyée, pour l'onglet
--    Newsletter de Provenance.
alter table public.profiles add column if not exists newsletter_opt_in boolean not null default false;
alter table public.profiles add column if not exists newsletter_opt_in_at timestamptz;

alter table public.newsletter_issues add column if not exists edition text;
alter table public.newsletter_issues add column if not exists preheader text;
alter table public.newsletter_issues add column if not exists recipients integer;
alter table public.newsletter_issues add column if not exists html text;
