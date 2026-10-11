-- Dernière visite d'un membre (11/10/2026, demande de Jason : « la dernière fois
-- que la personne s'est connectée et sa dernière action » dans Membres).
-- auth.users.last_sign_in_at ne bouge qu'à la saisie du mot de passe : un membre
-- resté connecté des semaines garderait une vieille date. L'app note donc sa
-- visite au plus toutes les 6 heures (POST /api/me/seen).
alter table public.profiles add column if not exists last_seen_at timestamptz;
