-- Phase 1, Enrichissement de la fiche voyageur
-- Transforme un répertoire passif en mini-CRM hôtelier :
-- tags, source, fiscalité (date naissance, nationalité), vérification ID, statut, blocage, préférences
--
-- Toutes les colonnes sont optionnelles (NULL/default), aucun breaking change

ALTER TABLE voyageurs
  -- ─── Tags & catégorisation ──────────────────────────────────────
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[],

  -- ─── Source d'acquisition ───────────────────────────────────────
  -- airbnb, booking, vrbo, abritel, gites_de_france, direct, recommandation, autre
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT NULL,

  -- ─── Identité / fiche police ────────────────────────────────────
  ADD COLUMN IF NOT EXISTS date_naissance     DATE    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nationalite        TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS adresse            TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS code_postal        TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ville              TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pays               TEXT    DEFAULT NULL,

  -- ─── Vérification ID (RGPD : opt-in, on stocke juste un statut + URL optionnelle) ─
  ADD COLUMN IF NOT EXISTS id_verifie         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS id_url             TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS id_type            TEXT    DEFAULT NULL, -- cni, passeport, permis, autre

  -- ─── Préférences voyageur ───────────────────────────────────────
  -- ex: ['silence', 'animaux_compagnie', 'famille', 'business', 'allergique_chats', 'pmr']
  ADD COLUMN IF NOT EXISTS preferences TEXT[] DEFAULT '{}'::TEXT[],

  -- ─── Note privée (1-5 étoiles, l'avis perso de l'hôte) ──────────
  ADD COLUMN IF NOT EXISTS note_privee SMALLINT DEFAULT NULL,

  -- ─── Blocage (≠ supprimer : garde l'historique mais empêche nouveaux séjours) ─
  ADD COLUMN IF NOT EXISTS bloque BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bloque_motif TEXT DEFAULT NULL;

-- Contraintes de domaine
ALTER TABLE voyageurs
  DROP CONSTRAINT IF EXISTS voyageurs_note_privee_check,
  ADD CONSTRAINT voyageurs_note_privee_check
    CHECK (note_privee IS NULL OR (note_privee >= 1 AND note_privee <= 5));

ALTER TABLE voyageurs
  DROP CONSTRAINT IF EXISTS voyageurs_source_check,
  ADD CONSTRAINT voyageurs_source_check
    CHECK (source IS NULL OR source IN (
      'airbnb', 'booking', 'vrbo', 'abritel', 'gites_de_france',
      'driing', 'direct', 'recommandation', 'autre'
    ));

ALTER TABLE voyageurs
  DROP CONSTRAINT IF EXISTS voyageurs_id_type_check,
  ADD CONSTRAINT voyageurs_id_type_check
    CHECK (id_type IS NULL OR id_type IN ('cni', 'passeport', 'permis', 'autre'));

-- Index
CREATE INDEX IF NOT EXISTS voyageurs_bloque_idx        ON voyageurs(user_id, bloque);
CREATE INDEX IF NOT EXISTS voyageurs_id_verifie_idx    ON voyageurs(user_id, id_verifie);
CREATE INDEX IF NOT EXISTS voyageurs_source_idx        ON voyageurs(user_id, source);
-- GIN index pour recherche dans tags / préférences
CREATE INDEX IF NOT EXISTS voyageurs_tags_idx          ON voyageurs USING GIN (tags);
CREATE INDEX IF NOT EXISTS voyageurs_preferences_idx   ON voyageurs USING GIN (preferences);
