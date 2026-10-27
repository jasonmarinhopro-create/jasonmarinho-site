#!/usr/bin/env bash
# Build du site statique sur Vercel (vercel.json → buildCommand).
# Vercel refuse un buildCommand de plus de 256 caractères (12/10/2026) :
# les étapes vivent ici. Ajouter une étape = une ligne.
set -e
node scripts/sync-counts.mjs
node scripts/build-signalements.mjs
node scripts/build-photographers.mjs
node scripts/build-cleaners.mjs
node scripts/build-exemples-fiches.mjs
node scripts/build-trouver-un-pro.mjs
node scripts/build-derniers-articles.mjs
node scripts/inject-font-loading.mjs
node scripts/build-phosphor-subset.mjs
node scripts/inline-font-css.mjs
node scripts/minify-assets.mjs
