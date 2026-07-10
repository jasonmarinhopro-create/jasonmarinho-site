-- Accompagnants du check-in en ligne (groupe sur un seul lien).
--
-- Légal : chaque voyageur étranger doit être déclaré — PT (SIBA) : un
-- boletim par personne, mineurs inclus ; FR : une fiche de police par
-- voyageur, sauf enfants de moins de 15 ans qui peuvent figurer sur la
-- fiche d'un adulte accompagnant (arrêté du 1er octobre 2015).
--
-- UX : le voyageur PRINCIPAL (fiche voyageurs) remplit le check-in et
-- ajoute ses accompagnants sur le MÊME lien — pas un lien par personne.
-- À chaque soumission du check-in, les accompagnants sont remplacés
-- (delete + insert) : la dernière soumission fait foi.

create table if not exists public.checkin_companions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  -- Voyageur principal (porteur du lien de check-in)
  voyageur_id   uuid not null references public.voyageurs(id) on delete cascade,
  prenom        text not null,
  nom           text not null,
  date_naissance date default null,
  lieu_naissance text default null,
  nationalite   text default null,   -- ISO-2
  id_type       text default null,   -- cni / passeport / permis / autre
  id_numero     text default null,
  id_pays_emetteur text default null, -- ISO-2
  created_at    timestamptz not null default now()
);

create index if not exists checkin_companions_voyageur_idx
  on public.checkin_companions(voyageur_id);
create index if not exists checkin_companions_user_idx
  on public.checkin_companions(user_id);

-- RLS : l'hôte ne voit que ses accompagnants. Les écritures publiques du
-- check-in passent par le service role (route /api/checkin/submit).
alter table public.checkin_companions enable row level security;

drop policy if exists "checkin_companions_select_own" on public.checkin_companions;
create policy "checkin_companions_select_own"
  on public.checkin_companions for select
  using (auth.uid() = user_id);

drop policy if exists "checkin_companions_insert_own" on public.checkin_companions;
create policy "checkin_companions_insert_own"
  on public.checkin_companions for insert
  with check (auth.uid() = user_id);

drop policy if exists "checkin_companions_update_own" on public.checkin_companions;
create policy "checkin_companions_update_own"
  on public.checkin_companions for update
  using (auth.uid() = user_id);

drop policy if exists "checkin_companions_delete_own" on public.checkin_companions;
create policy "checkin_companions_delete_own"
  on public.checkin_companions for delete
  using (auth.uid() = user_id);
