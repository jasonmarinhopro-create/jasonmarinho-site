-- Comptes qui ne reçoivent pas l'annonce des nouvelles formations (26/10/2026,
-- Jason : un associé de Driing ne doit pas recevoir ces notifications).
-- Les comptes concernés sont cochés en base, jamais dans le dépôt (public).
alter table public.profiles
  add column if not exists masquer_annonces_formations boolean not null default false;
