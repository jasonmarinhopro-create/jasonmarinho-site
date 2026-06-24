-- ════════════════════════════════════════════════════════════════════
-- Multi-espaces : décorréler profile.role et les espaces pros
-- ════════════════════════════════════════════════════════════════════
-- Avant : profile.role pouvait être 'user', 'admin', 'photographer' ou
-- 'cleaner'. Conséquence : un même compte ne pouvait avoir qu'UN seul
-- type d'espace, forçant le switch via déconnexion/reconnexion.
--
-- Après : profile.role redevient juste 'user' (par défaut) ou 'admin'.
-- L'accès aux espaces pros est déterminé dynamiquement par la présence
-- d'une row dans photographers/cleaners avec user_id = utilisateur.
-- Un même compte peut désormais avoir plusieurs espaces actifs en
-- parallèle (hôte + photographe + ménage), avec un sélecteur dans le
-- header pour switcher en 1 clic.
-- ════════════════════════════════════════════════════════════════════

-- Reset des rôles 'photographer' et 'cleaner' → 'user'
-- (les fiches restent liées via photographers.user_id / cleaners.user_id)
update public.profiles set role = 'user'
  where role in ('photographer', 'cleaner');

comment on column public.profiles.role is
  'Rôle utilisateur de base. Valeurs : user (défaut, accès plateforme hôte) ou admin (Jason). Les rôles pros (photographe / équipe ménage) ne se reflètent plus ici : ils sont déterminés par la présence d''une row dans photographers/cleaners.user_id.';
