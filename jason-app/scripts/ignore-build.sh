#!/usr/bin/env bash
# « Ignored Build Step » du projet Vercel de l'app (jason-app/vercel.json →
# ignoreCommand). Code de sortie : 0 = ne pas construire, 1 = construire.
# 04/11/2026 : 47 des 97 déploiements de la semaine venaient de robots
# (historique des réseaux sociaux, articles) qui ne touchent pas l'app.
# Dans le doute (premier déploiement, commit introuvable), on construit.
prev="${VERCEL_GIT_PREVIOUS_SHA:-}"
[ -z "$prev" ] && { echo "Pas de déploiement précédent connu : construction."; exit 1; }
files=$(git diff --name-only "$prev" HEAD 2>/dev/null) || { echo "Commit précédent introuvable : construction."; exit 1; }
[ -z "$files" ] && { echo "Même code que le déploiement précédent : construction (redéploiement demandé)."; exit 1; }
# Fichiers lus par la construction de l'app : jason-app/ et le script de compteurs
if printf '%s\n' "$files" | grep -qE '^(jason-app/|scripts/sync-counts\.mjs$)'; then
  echo "L'app a changé : construction."; exit 1
fi
echo "Aucun fichier de l'app modifié : construction ignorée."
exit 0
