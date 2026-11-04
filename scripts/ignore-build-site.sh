#!/usr/bin/env bash
# « Ignored Build Step » du projet Vercel du site (vercel.json → ignoreCommand).
# Code de sortie : 0 = ne pas construire, 1 = construire.
# 04/11/2026 : 41 des 97 déploiements de la semaine venaient des robots des
# réseaux sociaux, qui n'écrivent que data/social/ et data/social-queue/.
# On ne saute la construction que si TOUS les fichiers changés sont de ce
# genre ET qu'aucune reconstruction n'a été demandée par l'app (fiche pro
# publiée, signalement validé : site_rebuild_state.triggered_at, migration 178).
# Dans le doute, on construit.
prev="${VERCEL_GIT_PREVIOUS_SHA:-}"
[ -z "$prev" ] && { echo "Pas de déploiement précédent connu : construction."; exit 1; }
[ "$prev" = "${VERCEL_GIT_COMMIT_SHA:-}" ] && { echo "Même commit : reconstruction demandée, construction."; exit 1; }
files=$(git diff --name-only "$prev" HEAD 2>/dev/null) || { echo "Commit précédent introuvable : construction."; exit 1; }
[ -z "$files" ] && { echo "Aucun fichier changé : construction."; exit 1; }
if printf '%s\n' "$files" | grep -qvE '^(data/social/|data/social-queue/|docs/|\.github/)'; then
  echo "Des fichiers du site ont changé : construction."; exit 1
fi
# Reconstruction demandée par l'app dans les 30 dernières minutes ? Alors on construit.
url="${NEXT_PUBLIC_SUPABASE_URL:-}"; key="${SUPABASE_SERVICE_ROLE_KEY:-}"
[ -z "$url" ] || [ -z "$key" ] && { echo "Base injoignable depuis la construction : construction par prudence."; exit 1; }
last=$(curl -s --max-time 8 "$url/rest/v1/site_rebuild_state?select=triggered_at&id=eq.1" -H "apikey: $key" -H "Authorization: Bearer $key" | sed -n 's/.*"triggered_at":"\([^"]*\)".*/\1/p')
if [ -n "$last" ]; then
  age=$(( $(date -u +%s) - $(date -u -d "$last" +%s 2>/dev/null || echo 0) ))
  [ "$age" -lt 1800 ] && { echo "Reconstruction demandée par l'app il y a ${age} s : construction."; exit 1; }
elif ! curl -s --max-time 8 -o /dev/null -w '%{http_code}' "$url/rest/v1/site_rebuild_state?select=id&id=eq.1" -H "apikey: $key" -H "Authorization: Bearer $key" | grep -q '^200$'; then
  echo "État des reconstructions illisible : construction par prudence."; exit 1
fi
echo "Seulement des fichiers des robots des réseaux sociaux ou de la documentation : construction ignorée."
exit 0
