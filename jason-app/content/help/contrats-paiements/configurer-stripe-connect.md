---
title: "Configurer Stripe Connect pour encaisser le loyer"
excerpt: "Connecter ton compte Stripe en 5 minutes pour recevoir les paiements directement."
order: 2
relatedPages: [/dashboard/profil]
updatedAt: "2026-05-08"
---

## Stripe Connect : encaisser directement sur ton compte

Le dashboard intègre **Stripe Connect**. Concrètement : les paiements (loyer + caution) arrivent **directement sur ton compte bancaire personnel**, sans passer par Jason Marinho.

> Le voyageur paie via un lien sécurisé Stripe. L'argent va chez toi. Jason Marinho ne touche **rien** sur les transactions (Stripe prend ses ~1,4% de frais standards comme partout ailleurs).

---

## Pourquoi utiliser Stripe ?

| | Airbnb | Stripe via dashboard |
|---|---|---|
| **Versement** | 24h après check-in | Configurable par toi |
| **Caution** | Via AirCover (limité) | Tu contrôles totalement |
| **Commission plateforme** | 3% hôte minimum | 0% (juste les frais Stripe ~1,4%) |
| **Historique** | Sur Airbnb | Sur ton dashboard Stripe |
| **Réservation directe** | ❌ Impossible | ✅ Idéal |

---

## Étape 1 — Créer un compte Stripe (si tu n'en as pas)

Si tu **n'as jamais utilisé Stripe** :

1. Va sur [stripe.com](https://stripe.com)
2. Clique sur **Démarrer**
3. Crée ton compte avec :
   - Email professionnel
   - Numéro de téléphone (vérification SMS)
   - Pays : France
4. Renseigne tes infos pro :
   - Type d'activité : "Location courte durée" ou "Hébergement touristique"
   - SIRET (si tu en as un)
   - IBAN pour les versements
5. Téléverse une **pièce d'identité** (CNI ou passeport)

> Stripe valide ton compte en 24-48h. Tu peux commencer à utiliser le dashboard avant la validation, mais les versements seront retenus jusqu'à validation.

## Étape 2 — Connecter Stripe au dashboard

1. Dans le dashboard, va dans **Profil** (en haut à droite ou sidebar)
2. Section **Paiements**
3. Clique sur **Connecter Stripe**
4. Tu es redirigé vers Stripe pour autoriser la connexion (OAuth)
5. **Confirme** l'autorisation
6. Tu reviens dans le dashboard, ton compte est connecté

Tu vois maintenant **Compte Stripe connecté ✓** dans ton profil.

## Étape 3 — Premier test

Pour vérifier que tout fonctionne :

1. Crée un séjour de test (avec ton propre email)
2. Génère un contrat
3. Envoie un **lien de paiement** (5€ symboliques par exemple)
4. Paie depuis ton autre carte bancaire
5. Vérifie que le paiement apparaît dans ton **Dashboard Stripe** (stripe.com)

---

## Ce qui change après la connexion

Une fois Stripe connecté, tu peux :

- **Envoyer un lien de paiement** depuis chaque fiche séjour
- **Bloquer une caution** sur la carte du voyageur (capture manuelle)
- **Capturer ou libérer** la caution après le séjour
- **Voir tous tes paiements** dans le dashboard et dans Stripe

Voir l'article [Encaisser loyer et caution](/dashboard/aide/contrats-paiements) pour les détails.

---

## Frais Stripe — combien ça coûte vraiment

Stripe prélève automatiquement à chaque transaction :

- **Carte UE** : 1,4% + 0,25€
- **Carte hors UE** : 2,9% + 0,25€

> Pour un loyer de 500€ payé par carte française : tu reçois **492,75€** sur ton compte. Comparé aux 3% Airbnb (15€) + commission voyageur (~12% = 60€), tu économises **~80€ par séjour** en passant en direct.

---

## Bon à savoir

> Stripe est **largement utilisé** : Uber, Shopify, Airbnb (côté entreprise), Doctolib… Si tu acceptes la carte bancaire, tu paies déjà des frais similaires sur les autres plateformes. Stripe n'est pas plus cher, il est juste **plus transparent**.
