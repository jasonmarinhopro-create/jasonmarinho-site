---
title: "Synchroniser ton calendrier Airbnb et Booking via iCal"
excerpt: "Importer automatiquement tes réservations Airbnb et Booking dans le dashboard."
order: 4
relatedPages: [/dashboard/calendrier]
updatedAt: "2026-05-08"
---

## iCal : le standard universel des calendriers

**iCal** (format `.ics`) est le standard que toutes les plateformes de location utilisent pour partager leurs calendriers. Airbnb, Booking, Vrbo, Abritel : tous proposent un lien iCal exportable.

En important ce lien dans le dashboard, tu vois **les réservations Airbnb et Booking directement dans ton calendrier Jason Marinho**, sans double saisie.

---

## Étape 1 — Récupérer le lien iCal d'Airbnb

1. Va sur **Airbnb** (en mode hôte)
2. **Calendrier** → choisis ton logement
3. Clique sur **Plus d'options** (en haut à droite) → **Disponibilité**
4. Descends jusqu'à **Synchroniser les calendriers**
5. Copie le lien d'**exportation** (celui qu'Airbnb te donne pour synchroniser ailleurs)

Le lien ressemble à : `https://www.airbnb.fr/calendar/ical/12345678.ics?s=xxx`

> **Important** : ce lien est secret. Ne le partage à personne, il donne accès à tes réservations.

---

## Étape 2 — Récupérer le lien iCal de Booking

1. Va sur l'**Extranet Booking.com** (en mode hôte)
2. Va dans **Établissements** → ton logement → **Calendrier**
3. Clique sur **Synchroniser**
4. Copie le lien iCal fourni

> Booking.com ne génère parfois le lien que si tu actives la synchronisation iCal dans les préférences. Vérifie dans **Politique** → **Synchronisation calendriers**.

---

## Étape 3 — Ajouter le flux dans le dashboard

Dans le **Calendrier** du dashboard :

1. Clique sur l'icône **Paramètres** en haut à droite
2. **Ajouter un flux iCal**
3. Remplis :
   - **Nom** : "Airbnb - Studio Oberkampf" (pour t'y retrouver)
   - **URL** : le lien copié depuis Airbnb ou Booking
   - **Couleur** : choisis une couleur distincte par plateforme (bleu pour Airbnb, rouge pour Booking…)
4. Clique sur **Synchroniser**

Les réservations des **6 derniers mois** + **12 mois à venir** apparaissent dans ton calendrier.

---

## La synchronisation est automatique

Le dashboard re-synchronise les flux iCal **toutes les heures**. Si une nouvelle réservation arrive sur Airbnb, elle apparaît dans ton dashboard sous 1h maximum.

Tu peux **forcer une synchronisation manuelle** depuis les paramètres du flux.

---

## Limitation importante : la synchro est unidirectionnelle

Quand tu importes Airbnb dans le dashboard :

- ✅ Les réservations Airbnb apparaissent dans ton calendrier
- ❌ Bloquer une date dans le dashboard ne bloque pas Airbnb

Pour une **vraie protection contre les doubles réservations**, tu dois aussi exporter le calendrier Jason Marinho vers Airbnb.

### Exporter ton calendrier dashboard vers Airbnb

1. Dans le **Calendrier** du dashboard, clique sur **Partager le calendrier** (icône en haut)
2. Copie le lien iCal généré
3. Sur Airbnb : **Calendrier → Plus d'options → Synchroniser les calendriers → Importer un calendrier**
4. Colle le lien

Maintenant le va-et-vient bloque automatiquement les dates occupées **des deux côtés**.

---

## Bon à savoir

> Si tu utilises un **channel manager** (Smoobu, Lodgify, Hospitable…), c'est lui qui gère déjà cette synchro. Tu peux quand même importer son calendrier dans Jason Marinho pour la vue unifiée.

Pour la **réservation directe** (site perso, Driing, etc.), exporter le calendrier Jason Marinho vers Airbnb et Booking évite les doubles bookings.
