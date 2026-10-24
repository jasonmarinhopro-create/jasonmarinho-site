# Migrations en attente

Pas dans `migrations/` : le workflow « Migrations Supabase » ne les applique pas.

- `20261024_152_rls_politiques_en_double.sql` : politiques RLS en double. À remettre dans
  `migrations/` une fois le test des droits passé (lignes visibles identiques avant et après
  pour un admin, un hôte, un membre et un visiteur anonyme, dans une transaction annulée).
