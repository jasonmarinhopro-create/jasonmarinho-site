-- Intégration SIBA Web Service (Portugal) : envoi des boletins de
-- alojamento directement depuis le dashboard, sans passer par le portail.
-- L'hôte doit s'être inscrit sur siba.ssi.gov.pt avec l'option
-- « Web Service » — il reçoit alors sa chave de ativação par email.

-- ── Voyageurs : identité documentaire (requise par le boletim) ─────────────
alter table public.voyageurs
  add column if not exists id_numero        text default null,   -- n° du document (passeport/CNI)
  add column if not exists id_pays_emetteur text default null;   -- ISO-2 du pays émetteur

-- ── Logements : configuration SIBA par établissement AL ───────────────────
-- La chave d'accès est une donnée sensible du même niveau que l'IBAN déjà
-- stocké dans profiles : protégée par RLS existante sur logements.
alter table public.logements
  add column if not exists siba_unidade         text default null,  -- NIPC/NIF de l'entité exploratrice
  add column if not exists siba_estabelecimento text default null,  -- n° d'établissement attribué (souvent '00')
  add column if not exists siba_chave           text default null,  -- chave de ativação (courrier/email officiel)
  add column if not exists siba_abreviatura     text default null,  -- abréviation du nom (max 10 car.)
  add column if not exists siba_localidade      text default null,  -- localité (ex: Lisboa)
  add column if not exists siba_codigo_postal   text default null,  -- 4 chiffres (ex: 3660)
  add column if not exists siba_zona_postal     text default null,  -- 3 chiffres (ex: 366)
  add column if not exists siba_telefone        text default null;  -- téléphone de contact

-- ── Déclarations : traçabilité de l'envoi Web Service ─────────────────────
alter table public.guest_declarations
  add column if not exists siba_sent_at     timestamptz default null,
  add column if not exists siba_file_number integer     default null;
