-- Idempotence pour le webhook Stripe : Stripe garantit "at-least-once delivery",
-- on dédoublonne via event_id pour éviter de rejouer un event déjà traité.
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

create index if not exists stripe_webhook_events_processed_at_idx
  on public.stripe_webhook_events (processed_at desc);

-- RLS : table interne, jamais lue depuis le client (service role uniquement)
alter table public.stripe_webhook_events enable row level security;
