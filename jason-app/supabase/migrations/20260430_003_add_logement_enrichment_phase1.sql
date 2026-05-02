-- Phase 1, Enrichissement de la fiche logement
-- Transforme la fiche d'un référentiel statique en hub central du bien :
-- caractéristiques physiques, conformité légale, tarifs, équipements, liens annonces, contacts utiles, photos
--
-- Toutes les colonnes sont optionnelles (NULL par défaut) pour ne pas casser l'existant.

ALTER TABLE logements
  -- ─── Caractéristiques physiques ─────────────────────────────
  ADD COLUMN IF NOT EXISTS type_logement     TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS surface_m2        INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nb_chambres       INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nb_lits           INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nb_sdb            INTEGER DEFAULT NULL,

  -- ─── Conformité légale & classement ─────────────────────────
  ADD COLUMN IF NOT EXISTS numero_enregistrement TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS classement_etoiles    INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dpe                   TEXT    DEFAULT NULL,

  -- ─── Tarifs de base ─────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS tarif_nuitee_moyen NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS frais_menage       NUMERIC(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS caution            NUMERIC(10,2) DEFAULT NULL,

  -- ─── Équipements (array de slugs : parking, piscine, wifi, climatisation, lave-linge, etc.) ─
  ADD COLUMN IF NOT EXISTS equipements TEXT[] DEFAULT '{}'::TEXT[],

  -- ─── Liens annonces externes ────────────────────────────────
  ADD COLUMN IF NOT EXISTS lien_airbnb       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lien_booking      TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lien_gmb          TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lien_site_direct  TEXT DEFAULT NULL,

  -- ─── Photos ─────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS photo_couverture_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS photos_urls          TEXT[] DEFAULT '{}'::TEXT[],

  -- ─── Contacts utiles ────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS contact_urgence_nom TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contact_urgence_tel TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contact_menage_nom  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contact_menage_tel  TEXT DEFAULT NULL,

  -- ─── Statut ─────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT TRUE,

  -- ─── Spécifique conciergerie (utilisé en Phase 5) ───────────
  ADD COLUMN IF NOT EXISTS proprietaire_nom       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS proprietaire_email     TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS proprietaire_telephone TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS honoraires_pct         NUMERIC(5,2) DEFAULT NULL;

-- Contraintes de domaine sur le DPE et le classement
ALTER TABLE logements
  DROP CONSTRAINT IF EXISTS logements_dpe_check,
  ADD CONSTRAINT logements_dpe_check
    CHECK (dpe IS NULL OR dpe IN ('A','B','C','D','E','F','G'));

ALTER TABLE logements
  DROP CONSTRAINT IF EXISTS logements_classement_check,
  ADD CONSTRAINT logements_classement_check
    CHECK (classement_etoiles IS NULL OR (classement_etoiles >= 0 AND classement_etoiles <= 5));

ALTER TABLE logements
  DROP CONSTRAINT IF EXISTS logements_type_check,
  ADD CONSTRAINT logements_type_check
    CHECK (type_logement IS NULL OR type_logement IN (
      'gite', 'chambres-hotes', 'appartement', 'studio', 'maison', 'villa', 'autre'
    ));

-- Index pour les filtres list
CREATE INDEX IF NOT EXISTS logements_actif_idx ON logements(user_id, actif);
CREATE INDEX IF NOT EXISTS logements_type_idx  ON logements(user_id, type_logement);
