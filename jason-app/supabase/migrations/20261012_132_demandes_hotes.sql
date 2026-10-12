-- Demande inversée (12/10/2026, idée de Jason) : l'hôte décrit son besoin
-- (photographe ou ménage) sur jasonmarinho.com/trouver-un-pro, la demande part
-- toute seule aux 3 pros les plus proches de l'annuaire ; sans réponse au bout
-- de 48 h, à 3 autres ; sans pro dans la zone, aux pros qui s'inscrivent dans
-- les 30 jours. Chaque envoi crée aussi une ligne dans photographer_contacts /
-- cleaner_contacts (Demandes reçues du pro). Serveur seulement (RLS sans
-- politique). Conservation : 12 mois (purge dans le cron notifications-engine).

create table if not exists public.demandes_hotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  metier text not null check (metier in ('photographe', 'menage')),
  ville text not null,
  logement text,
  quand text,
  frequence text,
  budget text,
  message text,
  nom text not null,
  email text not null,
  telephone text,
  consent_at timestamptz not null,
  source text,
  acquisition jsonb,
  status text not null default 'envoyee' check (status in ('envoyee', 'elargie', 'sans_pro', 'close')),
  -- [{ "id": pro, "contact_id": ligne Demandes reçues, "round": 1, "at": "…" }]
  sent_to jsonb not null default '[]'::jsonb,
  last_round_at timestamptz,
  admin_notified_at timestamptz
);

create index if not exists demandes_hotes_created_idx on public.demandes_hotes (created_at desc);
create index if not exists demandes_hotes_status_idx on public.demandes_hotes (status, last_round_at);

alter table public.demandes_hotes enable row level security;
