-- Prospection par e-mail (29/09/2026) : photographes, équipes de ménage et
-- hôtes. Séquences d'e-mails (étapes J+n, même fil, boucles, enchaînement),
-- pipeline par contact, envoi depuis la boîte de Jason (SMTP, pas Resend :
-- Resend interdit la prospection), réponses et rebonds lus en IMAP.
-- Toutes les tables sont réservées au service role (pages admin après
-- vérification du rôle, cron). Voir lib/outreach/.

-- ── Contacts (prospects) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_contacts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience         text NOT NULL CHECK (audience IN ('photographe', 'menage', 'hote', 'autre')),
  email            text,
  email_norm       text GENERATED ALWAYS AS (lower(btrim(email))) STORED,
  prenom           text,
  nom              text,
  entreprise       text,
  ville            text,
  departement      text,
  site_web         text,
  telephone        text,
  instagram        text,
  siren            text,
  -- Origine de la donnée (obligation d'information CNIL au premier message)
  source           text NOT NULL DEFAULT 'manuel' CHECK (source IN ('manuel', 'csv', 'sirene', 'google', 'datatourisme', 'site')),
  source_detail    text,
  collected_at     timestamptz NOT NULL DEFAULT now(),
  stage            text NOT NULL DEFAULT 'a_contacter' CHECK (stage IN (
                     'a_trouver', 'a_contacter', 'contacte', 'a_repondu', 'interesse',
                     'inscrit', 'client', 'pas_interesse', 'desinscrit', 'invalide')),
  notes            text,
  tags             text[] NOT NULL DEFAULT '{}',
  last_contacted_at timestamptz,
  replied_at       timestamptz,
  unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS outreach_contacts_email_uniq ON public.outreach_contacts (email_norm) WHERE email_norm IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS outreach_contacts_siren_uniq ON public.outreach_contacts (audience, siren) WHERE siren IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_contacts_stage_idx ON public.outreach_contacts (audience, stage);

-- ── Opposition (désinscriptions, rebonds) : gardée même si le contact est supprimé
CREATE TABLE IF NOT EXISTS public.outreach_suppressions (
  email_norm  text PRIMARY KEY,
  reason      text NOT NULL CHECK (reason IN ('desinscrit', 'rebond', 'plainte', 'manuel')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Séquences ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_sequences (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom               text NOT NULL,
  audience          text NOT NULL CHECK (audience IN ('photographe', 'menage', 'hote', 'autre')),
  description       text,
  -- manuel : contacts ajoutés à la main ; nouveau_contact : tout nouveau
  -- contact de l'audience avec un e-mail ; etape : contact qui arrive à `trigger_stage`
  trigger           text NOT NULL DEFAULT 'manuel' CHECK (trigger IN ('manuel', 'nouveau_contact', 'etape')),
  trigger_stage     text,
  enabled           boolean NOT NULL DEFAULT false,
  stop_on_reply     boolean NOT NULL DEFAULT true,
  -- Boucle : sans réponse à la fin, on recommence après N jours (max_repeats fois)
  repeat_after_days integer CHECK (repeat_after_days IS NULL OR repeat_after_days BETWEEN 7 and 365),
  max_repeats       integer NOT NULL DEFAULT 0 CHECK (max_repeats BETWEEN 0 AND 5),
  -- Enchaînement : à la fin (sans réponse), le contact passe dans cette séquence
  then_sequence_id  uuid REFERENCES public.outreach_sequences(id) ON DELETE SET NULL,
  -- Étape du pipeline donnée au contact à la fin de la séquence (facultatif)
  end_stage         text,
  playbook_key      text UNIQUE,
  position          integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.outreach_steps (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id  uuid NOT NULL REFERENCES public.outreach_sequences(id) ON DELETE CASCADE,
  position     integer NOT NULL,
  delay_days   integer NOT NULL DEFAULT 0 CHECK (delay_days BETWEEN 0 AND 90),
  subject      text NOT NULL,
  body         text NOT NULL,
  same_thread  boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outreach_steps_seq_idx ON public.outreach_steps (sequence_id, position);

-- ── Parcours d'un contact dans une séquence ───────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_enrollments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id       uuid NOT NULL REFERENCES public.outreach_sequences(id) ON DELETE CASCADE,
  contact_id        uuid NOT NULL REFERENCES public.outreach_contacts(id) ON DELETE CASCADE,
  status            text NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'terminee', 'arretee')),
  stop_reason       text,
  next_step         integer NOT NULL DEFAULT 0,
  next_send_on      date,
  loop_count        integer NOT NULL DEFAULT 0,
  thread_message_id text,
  thread_subject    text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sequence_id, contact_id)
);
CREATE INDEX IF NOT EXISTS outreach_enrollments_due_idx ON public.outreach_enrollments (status, next_send_on);
CREATE INDEX IF NOT EXISTS outreach_enrollments_contact_idx ON public.outreach_enrollments (contact_id);

-- ── Journal des envois ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_sends (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id  uuid REFERENCES public.outreach_enrollments(id) ON DELETE SET NULL,
  contact_id     uuid REFERENCES public.outreach_contacts(id) ON DELETE CASCADE,
  sequence_id    uuid REFERENCES public.outreach_sequences(id) ON DELETE SET NULL,
  step_position  integer,
  email          text NOT NULL,
  subject        text NOT NULL,
  message_id     text,
  status         text NOT NULL CHECK (status IN ('envoye', 'erreur')),
  error          text,
  sent_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outreach_sends_day_idx ON public.outreach_sends (sent_at);

-- ── Réglages (une seule ligne) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_settings (
  id               integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  daily_cap        integer NOT NULL DEFAULT 25 CHECK (daily_cap BETWEEN 1 AND 200),
  send_days        integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  paused           boolean NOT NULL DEFAULT false,
  signature        text,
  last_imap_check  timestamptz,
  last_run_at      timestamptz,
  last_run_summary text,
  updated_at       timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.outreach_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.outreach_contacts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_sequences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_steps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_sends        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_settings     ENABLE ROW LEVEL SECURITY;
