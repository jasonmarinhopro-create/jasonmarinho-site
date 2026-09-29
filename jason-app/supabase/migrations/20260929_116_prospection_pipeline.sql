-- Prospection, suite (29/09/2026) : pipeline en glisser-déposer avec
-- étiquettes, rappels et séquences déclenchées par une étiquette ; photo
-- dans la signature. Le code tolère l'absence de ces colonnes.

-- Rappel sur un contact (« Relancer par téléphone », date)
ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS next_action    text;
ALTER TABLE public.outreach_contacts ADD COLUMN IF NOT EXISTS next_action_on date;
-- Étiquettes (colonne `tags` créée par la migration 115) : recherche rapide
CREATE INDEX IF NOT EXISTS outreach_contacts_tags_idx ON public.outreach_contacts USING gin (tags);

-- Séquence déclenchée quand une étiquette est ajoutée à un contact
ALTER TABLE public.outreach_sequences ADD COLUMN IF NOT EXISTS trigger_tag text;
ALTER TABLE public.outreach_sequences DROP CONSTRAINT IF EXISTS outreach_sequences_trigger_check;
ALTER TABLE public.outreach_sequences ADD CONSTRAINT outreach_sequences_trigger_check
  CHECK (trigger IN ('manuel', 'nouveau_contact', 'etape', 'etiquette'));

-- Photo de Jason dans la signature des e-mails de prospection
ALTER TABLE public.outreach_settings ADD COLUMN IF NOT EXISTS signature_photo boolean NOT NULL DEFAULT true;
