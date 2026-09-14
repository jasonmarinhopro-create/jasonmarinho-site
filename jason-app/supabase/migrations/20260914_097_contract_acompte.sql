-- Acompte à la réservation (paiement partiel du loyer pour bloquer la
-- réservation, le reste étant réglé plus tard, typiquement à l'arrivée).
-- Distinct de la caution (montant_caution) qui n'est jamais un paiement de
-- loyer mais un dépôt de garantie remboursable.
--
-- 100 = comportement historique (solde intégral à la signature). Le solde
-- (reste après acompte) n'a pas de suivi automatisé dédié : à régler par le
-- locataire selon les modalités convenues avec le bailleur (espèces,
-- virement, TPE…), affiché sur le contrat mais pas encaissé via Stripe ici.
alter table public.contracts
  add column if not exists acompte_percent smallint not null default 100
  check (acompte_percent > 0 and acompte_percent <= 100);

comment on column public.contracts.acompte_percent is
  'Pourcentage du loyer total réglé pour sécuriser la réservation. 100 = solde intégral à la signature. Le solde restant (100 - acompte_percent) est à régler par le locataire selon les modalités convenues (ex: à l''arrivée), hors suivi Stripe automatisé.';
