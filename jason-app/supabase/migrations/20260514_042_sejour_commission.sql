-- ─────────────────────────────────────────────────────────────────────
-- Migration : commission plateforme sur les séjours
-- ─────────────────────────────────────────────────────────────────────
-- Permet de stocker le montant de commission prélevé par la plateforme
-- (Booking, Airbnb, etc.) sur un séjour pour calculer le revenu net.
--
-- Contexte : sur Booking, le voyageur paye le montant total (ex: 809€)
-- à l'hôte, qui doit ensuite reverser une commission (~15-16%) à
-- Booking. Le revenu net pour l'hôte = montant - commission.
-- Sur les réservations Driing/direct, commission = 0.

alter table public.sejours
  add column if not exists commission_montant numeric(10, 2) default null;

comment on column public.sejours.commission_montant is
  'Commission € prélevée par la plateforme (booking, airbnb...). null = pas renseigné. 0 = réservation directe sans commission.';
