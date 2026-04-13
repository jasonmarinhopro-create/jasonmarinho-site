-- ──────────────────────────────────────────────────────────────────────────────
-- Migration : Système de contrats de location saisonnière
-- Conforme au droit français (Code civil Art. 1366, Code du tourisme L324-1)
-- et au règlement eIDAS (UE) 910/2014 (Signature Électronique Simple)
-- RGPD : données conservées 5 ans (prescription civile française)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Relations ──────────────────────────────────────────────────────────────
  sejour_id   UUID NOT NULL REFERENCES public.sejours(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voyageur_id UUID NOT NULL REFERENCES public.voyageurs(id) ON DELETE CASCADE,

  -- ── Bailleur (instantané à la création) ────────────────────────────────────
  bailleur_prenom    TEXT NOT NULL,
  bailleur_nom       TEXT NOT NULL,
  bailleur_email     TEXT NOT NULL,
  bailleur_telephone TEXT,
  bailleur_adresse   TEXT,

  -- ── Locataire (instantané à la création) ───────────────────────────────────
  locataire_prenom    TEXT NOT NULL,
  locataire_nom       TEXT NOT NULL,
  locataire_email     TEXT,
  locataire_telephone TEXT,

  -- ── Bien loué ───────────────────────────────────────────────────────────────
  logement_adresse     TEXT NOT NULL,
  logement_description TEXT,           -- type, superficie, équipements
  capacite_max         INTEGER DEFAULT 1,

  -- ── Durée du séjour ─────────────────────────────────────────────────────────
  date_arrivee  DATE NOT NULL,
  date_depart   DATE NOT NULL,
  heure_arrivee TEXT DEFAULT '16:00',
  heure_depart  TEXT DEFAULT '11:00',

  -- ── Conditions financières ──────────────────────────────────────────────────
  montant_loyer       NUMERIC(10,2) NOT NULL DEFAULT 0,
  montant_caution     NUMERIC(10,2) NOT NULL DEFAULT 0,
  modalites_paiement  TEXT NOT NULL DEFAULT 'Virement bancaire',

  -- ── Clauses contractuelles ──────────────────────────────────────────────────
  -- Conditions d'annulation (obligatoire — Code civil Art. 1229)
  conditions_annulation TEXT NOT NULL DEFAULT
    'En cas d''annulation par le locataire plus de 30 jours avant l''arrivée, '
    'l''acompte versé est remboursé intégralement. '
    'En cas d''annulation moins de 30 jours avant l''arrivée, l''acompte reste acquis au bailleur.',

  -- Règlement intérieur (recommandé — bonnes pratiques)
  reglement_interieur TEXT DEFAULT
    '- Respecter le calme et la tranquillité du voisinage.\n'
    '- Interdiction de fumer à l''intérieur du logement.\n'
    '- Les animaux de compagnie ne sont pas admis sauf accord préalable du bailleur.\n'
    '- Toute fête ou rassemblement est interdit sans autorisation écrite du bailleur.\n'
    '- Le locataire s''engage à laisser le logement dans l''état dans lequel il l''a trouvé.',

  -- Clauses optionnelles
  animaux_acceptes  BOOLEAN NOT NULL DEFAULT FALSE,
  fumeur_accepte    BOOLEAN NOT NULL DEFAULT FALSE,

  -- ── Statut du contrat ───────────────────────────────────────────────────────
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'signe', 'annule')),

  -- ── Signature électronique (conformité eIDAS SES) ──────────────────────────
  -- Token unique pour accès public à la page de signature
  token           UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),

  -- Audit trail obligatoire pour valeur probante (eIDAS + Code civil Art. 1366)
  signature_date       TIMESTAMPTZ,            -- Horodatage exact de la signature
  signature_ip         TEXT,                   -- Adresse IP du signataire
  signature_user_agent TEXT,                   -- Navigateur / appareil du signataire
  signature_image      TEXT,                   -- Signature dessinée (base64 PNG)

  -- ── Timestamps ──────────────────────────────────────────────────────────────
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS contracts_user_id_idx     ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS contracts_sejour_id_idx   ON public.contracts(sejour_id);
CREATE INDEX IF NOT EXISTS contracts_voyageur_id_idx ON public.contracts(voyageur_id);
CREATE INDEX IF NOT EXISTS contracts_token_idx       ON public.contracts(token);
CREATE INDEX IF NOT EXISTS contracts_statut_idx      ON public.contracts(statut);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- L'hôte peut voir et gérer ses propres contrats
CREATE POLICY "Hôte gère ses contrats"
  ON public.contracts
  FOR ALL
  USING (auth.uid() = user_id);

-- ── Trigger : mise à jour automatique de updated_at ──────────────────────────
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION update_contracts_updated_at();

-- ── Commentaires de documentation ────────────────────────────────────────────
COMMENT ON TABLE public.contracts IS
  'Contrats de location saisonnière. Conformes Code civil Art. 1366, '
  'Code du tourisme L324-1, et règlement eIDAS (UE) 910/2014.';

COMMENT ON COLUMN public.contracts.token IS
  'Token UUID unique pour accès public à la page de signature. Expire après 30 jours.';

COMMENT ON COLUMN public.contracts.signature_ip IS
  'Adresse IP du signataire — requis pour audit trail eIDAS.';

COMMENT ON COLUMN public.contracts.signature_image IS
  'Signature manuscrite numérisée (base64 PNG). Stockée directement en DB '
  'pour garantir l''intégrité du document signé.';
