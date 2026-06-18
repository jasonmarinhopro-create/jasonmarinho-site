-- ════════════════════════════════════════════════════════════════════
-- Stratégie tarifaire par plateforme + saisonnalité par logement
-- ════════════════════════════════════════════════════════════════════
-- Avant : un seul champ tarif_nuitee_moyen (prix moyen toutes
-- plateformes confondues).
-- Maintenant : prix saisi PAR PLATEFORME + pourcentages saisonniers
-- modifiables. Permet :
--  - Calcul du revenu net par plateforme (commissions différentes)
--  - Recommandation tarif basse/moyenne/haute saison
--  - Comparaison directe vs ADR marché local
--
-- Tous les champs sont NULL par défaut → mode opt-in progressif.
-- L'ancienne tarif_nuitee_moyen reste utilisée comme fallback si rien
-- de neuf n'est saisi (rétro-compat 100%).
-- ════════════════════════════════════════════════════════════════════

alter table public.logements
  add column if not exists prix_airbnb_nuit numeric(10,2),
  add column if not exists prix_booking_nuit numeric(10,2),
  add column if not exists prix_direct_nuit numeric(10,2),
  add column if not exists prix_saison_basse_pct smallint default 70,
  add column if not exists prix_saison_haute_pct smallint default 140,
  add column if not exists prix_strategie_updated_at timestamptz;

comment on column public.logements.prix_airbnb_nuit is
  'Prix de base par nuit affiché sur Airbnb (saison moyenne, ce que voit le voyageur). En €.';
comment on column public.logements.prix_booking_nuit is
  'Prix de base par nuit affiché sur Booking (saison moyenne). En €.';
comment on column public.logements.prix_direct_nuit is
  'Prix de base par nuit en réservation directe / Driing (saison moyenne). En €.';
comment on column public.logements.prix_saison_basse_pct is
  'Multiplicateur saison basse, en pourcentage du prix de base. 70 = -30%. Défaut 70.';
comment on column public.logements.prix_saison_haute_pct is
  'Multiplicateur saison haute, en pourcentage du prix de base. 140 = +40%. Défaut 140.';
comment on column public.logements.prix_strategie_updated_at is
  'Timestamp de la dernière modif de la stratégie tarifaire. Permet de nudger si pas mis à jour depuis >6 mois.';

-- Index optionnel : si on filtre les logements sans stratégie configurée
-- (pour le nudge SetupChecklist sur le home dashboard)
create index if not exists logements_prix_strategie_idx
  on public.logements (user_id)
  where prix_airbnb_nuit is null and prix_booking_nuit is null and prix_direct_nuit is null;
