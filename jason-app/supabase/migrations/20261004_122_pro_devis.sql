-- ═══════════════════════════════════════════════════════════════════
-- Devis des pros de l'annuaire (photographes + équipes ménage), 04/10/2026.
--
-- Décision de Jason : l'app fait les devis (hors réforme de la facture
-- électronique), les factures se font dans un outil agréé (Tiime, Indy ou
-- celui du pro). Si le pro a déjà son outil (has_invoicing_tool), l'app
-- n'affiche plus nos partenaires.
--
-- Même modèle que le carnet clients (migration 069) : owner_kind + owner_id,
-- une seule table pour les deux métiers, RLS « le pro gère ses devis ».
-- Numéro attribué à l'envoi (un brouillon n'en a pas) par
-- next_pro_document_number, atomique, une série par année (D2026-0001).
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Infos du pro affichées sur ses devis ─────────────────────────
create table if not exists public.pro_billing_profiles (
  owner_kind text not null check (owner_kind in ('photographer', 'cleaner')),
  owner_id uuid not null,
  legal_name text,                 -- prénom et nom (ou raison sociale)
  trade_name text,                 -- nom commercial, facultatif
  legal_form text not null default 'EI' check (legal_form in ('EI', 'societe')),
  siret text,
  address text,
  email text,
  phone text,
  vat_mode text not null default 'franchise' check (vat_mode in ('franchise', 'tva')),
  vat_number text,
  default_vat_rate numeric(5,2) not null default 20,
  quote_validity_days int not null default 30,
  footer_note text,
  has_invoicing_tool boolean not null default false,  -- facture déjà dans son propre outil
  invoicing_tool text,                                 -- son nom, facultatif
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_kind, owner_id)
);

alter table public.pro_billing_profiles enable row level security;

drop policy if exists "Pros manage own billing profile" on public.pro_billing_profiles;
create policy "Pros manage own billing profile"
  on public.pro_billing_profiles
  for all
  to authenticated
  using (
    (owner_kind = 'photographer' and owner_id in (select id from public.photographers where user_id = auth.uid()))
    or
    (owner_kind = 'cleaner' and owner_id in (select id from public.cleaners where user_id = auth.uid()))
  )
  with check (
    (owner_kind = 'photographer' and owner_id in (select id from public.photographers where user_id = auth.uid()))
    or
    (owner_kind = 'cleaner' and owner_id in (select id from public.cleaners where user_id = auth.uid()))
  );

-- ── 2. Devis ────────────────────────────────────────────────────────
create table if not exists public.pro_documents (
  id uuid primary key default gen_random_uuid(),
  owner_kind text not null check (owner_kind in ('photographer', 'cleaner')),
  owner_id uuid not null,
  kind text not null default 'devis' check (kind in ('devis')),
  number text,                                -- null tant que brouillon
  status text not null default 'brouillon'
    check (status in ('brouillon', 'envoye', 'accepte', 'refuse')),
  client_id uuid references public.pro_clients(id) on delete set null,
  client_name text,
  client_email text,
  client_address text,
  client_is_pro boolean not null default false,
  client_siren text,
  title text,                                 -- objet : « Shooting photo, Villa Les Pins »
  issue_date date,
  service_date date,
  valid_until date,
  lines jsonb not null default '[]'::jsonb,   -- [{ label, detail, qty, unit, unit_price }]
  vat_mode text not null default 'franchise' check (vat_mode in ('franchise', 'tva')),
  vat_rate numeric(5,2) not null default 0,
  total_ht numeric(12,2) not null default 0,
  total_tva numeric(12,2) not null default 0,
  total_ttc numeric(12,2) not null default 0,
  notes text,                                 -- message au client
  seller jsonb,                               -- instantané des infos du pro à l'envoi
  public_token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  sent_at timestamptz,
  accepted_at timestamptz,
  accepted_name text,
  refused_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pro_documents_number_uniq
  on public.pro_documents (owner_kind, owner_id, kind, number)
  where number is not null;

create index if not exists pro_documents_owner_idx
  on public.pro_documents (owner_kind, owner_id, created_at desc);

alter table public.pro_documents enable row level security;

drop policy if exists "Pros manage own documents" on public.pro_documents;
create policy "Pros manage own documents"
  on public.pro_documents
  for all
  to authenticated
  using (
    (owner_kind = 'photographer' and owner_id in (select id from public.photographers where user_id = auth.uid()))
    or
    (owner_kind = 'cleaner' and owner_id in (select id from public.cleaners where user_id = auth.uid()))
  )
  with check (
    (owner_kind = 'photographer' and owner_id in (select id from public.photographers where user_id = auth.uid()))
    or
    (owner_kind = 'cleaner' and owner_id in (select id from public.cleaners where user_id = auth.uid()))
  );

create or replace function public.pro_documents_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pro_documents_touch on public.pro_documents;
create trigger pro_documents_touch
  before update on public.pro_documents
  for each row execute function public.pro_documents_touch_updated_at();

drop trigger if exists pro_billing_profiles_touch on public.pro_billing_profiles;
create trigger pro_billing_profiles_touch
  before update on public.pro_billing_profiles
  for each row execute function public.pro_documents_touch_updated_at();

revoke all on function public.pro_documents_touch_updated_at() from public, anon, authenticated;

-- ── 3. Numérotation ─────────────────────────────────────────────────
create table if not exists public.pro_document_counters (
  owner_kind text not null,
  owner_id uuid not null,
  kind text not null,
  year int not null,
  last int not null default 0,
  primary key (owner_kind, owner_id, kind, year)
);

alter table public.pro_document_counters enable row level security;
-- Aucune politique : lecture et écriture par le serveur seulement.

create or replace function public.next_pro_document_number(
  p_owner_kind text, p_owner_id uuid, p_kind text, p_year int
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last int;
begin
  if p_kind <> 'devis' then
    raise exception 'Type de document inconnu';
  end if;
  insert into public.pro_document_counters (owner_kind, owner_id, kind, year, last)
  values (p_owner_kind, p_owner_id, p_kind, p_year, 1)
  on conflict (owner_kind, owner_id, kind, year)
  do update set last = public.pro_document_counters.last + 1
  returning last into v_last;
  return 'D' || p_year::text || '-' || lpad(v_last::text, 4, '0');
end;
$$;

revoke all on function public.next_pro_document_number(text, uuid, text, int) from public, anon, authenticated;
grant execute on function public.next_pro_document_number(text, uuid, text, int) to service_role;
