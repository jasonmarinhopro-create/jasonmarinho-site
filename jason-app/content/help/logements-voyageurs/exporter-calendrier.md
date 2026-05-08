---
title: "Exporter ton calendrier vers Google Calendar, Apple Calendar ou Notion"
excerpt: "Voir tes séjours dans n'importe quel outil externe via un lien iCal."
order: 6
relatedPages: [/dashboard/calendrier]
updatedAt: "2026-05-08"
---

## Pourquoi exporter ton calendrier

Tu peux **partager** ton calendrier Jason Marinho vers d'autres outils en lecture seule :

- **Google Calendar** (perso ou pro)
- **Apple Calendar / iCloud**
- **Microsoft Outlook**
- **Notion** (via la vue calendrier)
- **Airbnb** ou **Booking** (pour bloquer les dates de leurs côtés)

Toutes ces apps acceptent un **lien iCal** comme source.

---

## Étape 1 — Générer ton lien iCal

Dans le **Calendrier** du dashboard :

1. Clique sur l'icône **Partager** en haut (à côté de Paramètres)
2. Si c'est ta première fois, le système te génère un **token unique** (lien sécurisé)
3. Copie le lien

Le lien ressemble à : `https://app.jasonmarinho.com/api/calendar/feed?token=xxx-yyy-zzz`

> **Important** : ce lien est secret. Quiconque a ce lien voit tous tes séjours. Ne le partage qu'aux outils où tu en as besoin.

---

## Étape 2 — Importer dans ton outil

### Dans Google Calendar

1. Ouvre **Google Calendar** sur ordinateur
2. Sidebar gauche → **Autres agendas** → **+** → **Avec une URL**
3. Colle le lien iCal
4. Le calendrier apparaît dans **Autres agendas**

Synchronisation : Google met à jour environ toutes les 12-24h (pas de contrôle dessus).

### Dans Apple Calendar (Mac)

1. Ouvre **Calendrier**
2. **Fichier** → **Nouvel abonnement à un calendrier**
3. Colle le lien iCal
4. Choisis la fréquence de mise à jour (15 min recommandé)

### Dans Notion

1. Sur ta page Notion, ajoute un bloc **Calendrier**
2. Connecte-le à Google Calendar (étape précédente)
3. Le calendrier Jason Marinho apparaît dans Notion

### Dans Airbnb (synchro retour)

Pour bloquer les dates Jason Marinho dans Airbnb :

1. Sur **Airbnb** → Calendrier → **Plus d'options** → **Synchroniser**
2. **Importer un calendrier** → colle le lien iCal Jason Marinho
3. Donne un nom (ex: "Jason Marinho")

Maintenant les séjours créés dans le dashboard sont **automatiquement bloqués sur Airbnb**.

---

## Régénérer le lien (révocation)

Si tu as accidentellement partagé ton lien à une mauvaise personne :

1. **Calendrier** → **Partager** → **Régénérer le lien**
2. Confirme
3. L'ancien lien devient invalide immédiatement
4. Tu dois mettre à jour tous les outils où tu l'avais collé

---

## Limitation importante

Le lien iCal exporte :

- ✅ Tous tes **séjours** (avec dates, voyageur, logement)
- ✅ Tous tes **événements** (ménage, blocage, etc.)
- ❌ Pas les **détails financiers** (loyer, caution, paiements)
- ❌ Pas les **contrats**

C'est volontaire : iCal est un format de calendrier, pas de gestion financière.
