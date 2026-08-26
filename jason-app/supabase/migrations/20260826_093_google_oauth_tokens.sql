-- Jeton OAuth Google (Search Console) — remplace l'approche compte de
-- service initialement prévue : la création de clés de compte de service
-- est bloquée par une règle d'organisation Google Cloud par défaut
-- (iam.disableServiceAccountKeyCreation), donc connexion OAuth classique à
-- la place (même principe que social_accounts pour Meta). Une seule ligne
-- attendue par service, "service" pouvant s'étendre à d'autres API Google
-- plus tard sans changer le schéma.

create table if not exists google_oauth_tokens (
  service         text primary key,
  refresh_token   text not null,        -- chiffré (lib/security/crypto.ts, même clé que les tokens sociaux)
  connected_by    uuid references profiles(id),
  connected_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table google_oauth_tokens enable row level security;

create policy "admin_all_google_oauth_tokens" on google_oauth_tokens for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
