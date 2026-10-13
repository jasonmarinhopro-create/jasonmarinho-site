-- Idées & feuille de route ouvertes à tous les membres (13/10/2026, décision
-- de Jason). Avant : réservées aux « contributeurs » qui avaient payé une
-- contribution (page /soutenir, retirée). Rejouable sans casse.

-- Espace d'où vient l'idée (hôte, photographe, équipe de ménage, investisseur)
alter table public.roadmap_items add column if not exists espace text;
-- Réponse courte de Jason affichée sous l'idée (« Prévu pour novembre »…)
alter table public.roadmap_items add column if not exists reponse text;
-- Date du dernier changement de statut (« Livrée le … »)
alter table public.roadmap_items add column if not exists status_changed_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'roadmap_items_espace_check') then
    alter table public.roadmap_items
      add constraint roadmap_items_espace_check
      check (espace is null or espace in ('hote', 'photographe', 'menage', 'investisseur'));
  end if;
end $$;

-- Seul un admin change le statut ou la réponse d'une idée (avant : l'auteur
-- pouvait aussi modifier la sienne, y compris la passer en « livrée »).
-- L'auteur garde la suppression de sa propre idée.
drop policy if exists "roadmap_items_update" on public.roadmap_items;
create policy "roadmap_items_update" on public.roadmap_items
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists idx_roadmap_items_status on public.roadmap_items(status);
