-- Newsletter mensuelle automatique (11/10/2026) : une ligne par mois, posée
-- avant l'appel à Brevo pour ne jamais programmer deux lettres le même mois.
-- Serveur seulement (service role).
create table if not exists public.newsletter_issues (
  month text primary key,
  status text not null default 'preparation',
  campaign_id bigint,
  subject text,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.newsletter_issues enable row level security;
revoke all on public.newsletter_issues from anon, authenticated;
