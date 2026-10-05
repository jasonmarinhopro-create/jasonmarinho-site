---
title: "Encaisser le loyer et gérer la caution"
excerpt: "Le paiement du loyer, la caution bloquée (jamais débitée sans toi), puis libérée ou retenue en partie."
order: 3
relatedPages: [/dashboard/contrats, /dashboard/voyageurs]
updatedAt: "2026-10-05"
---

## Le loyer

Si le contrat prévoit un paiement **Stripe**, le voyageur reçoit le lien de paiement après sa signature. Le loyer est encaissé tout de suite et arrive sur ton compte bancaire selon le calendrier de versement de Stripe.

Si tu as choisi un **acompte de 50 %**, seul l'acompte est payé en ligne. Le solde est indiqué « à régler à l'arrivée » sur le contrat, par le moyen convenu avec le voyageur.

## La caution : rien n'est débité

La caution par carte est une **empreinte bancaire** : la banque du voyageur met le montant de côté, mais **rien ne quitte son compte**. Selon sa banque, il peut voir la somme « en attente » dans son application. La page du contrat et l'e-mail le lui expliquent en 3 temps (blocage, ta décision après le départ, fin automatique au plus tard 7 jours après).

Après le séjour, toi seul décides, depuis **Contrats & paiements → Cautions** (toutes tes cautions au même endroit) ou depuis le bouton **Loyer et caution** du séjour sur la fiche voyageur :

- **Tout va bien : libérer la caution** : le blocage est levé tout de suite, rien n'est prélevé. L'app te demande de confirmer, puis le voyageur reçoit un e-mail « Votre caution est libérée »
- **Dommages constatés : retenir une somme** : tu indiques le **montant** (jusqu'au total de la caution) et le **motif**. Seule cette somme est prélevée, le reste est libéré tout de suite. Le voyageur reçoit un e-mail avec le montant et le motif. C'est définitif

Sans action de ta part, le blocage tombe tout seul : le voyageur ne paie rien. Garde tes preuves (photos, devis ou factures) : le contrat prévoit de les lui transmettre.

## Le lien part 2 jours avant l'arrivée

Pour un paiement en ligne, une carte reste bloquée **7 jours** au plus (Visa, Mastercard, American Express, Discover ; un peu moins pour Visa, environ 4 jours et 18 heures, quand le paiement est déclenché sans le voyageur). Passé ce délai, la banque lève le blocage toute seule. C'est pourquoi le lien de caution ne s'ouvre que **2 jours avant l'arrivée** : ce jour-là, l'app l'envoie automatiquement par email au voyageur. Avant, la page du contrat lui indique la date.

Une « autorisation étendue » jusqu'à 30 jours existe chez Stripe pour l'hébergement, mais elle est réservée aux comptes en tarification IC+ : elle n'est pas disponible dans l'app.

> Source : documentation Stripe, « Place a hold on a payment method » et « Place an extended hold on an online card payment » (docs.stripe.com), vérifiée en octobre 2026

Conséquences :

- Libère la caution ou retiens une somme **au plus tard 4 jours après l'arrivée**. La fenêtre Paiements t'indique la date exacte
- Pour un séjour de **plus de 4 nuits**, la carte sera débloquée avant l'état des lieux de sortie : préfère une caution par virement. L'assistant de contrat te prévient
- Si le blocage tombe avant que tu aies décidé, la caution passe en **Expirée** et tu reçois une notification. Si le séjour n'est pas terminé, renvoie le lien au voyageur

## Où gérer tout ça

- **Contrats & paiements → Paiements** : solde Stripe, virements, loyers à relancer
- **Contrats & paiements → Cautions** : cautions à décider (Libérer, Retenir une somme), en attente du voyageur (Copier le lien), terminées
- **Fiche du voyageur** → bouton **Loyer et caution** du séjour : état du loyer et de la caution, liens à copier, **Renvoyer l'email au voyageur**

## Les statuts

- **Loyer** : En attente de paiement, Réglé, Remboursé ou Échec paiement
- **Caution** : En attente de paiement, Carte bloquée (rien n'a été débité), Somme retenue, Libérée, Expirée ou Échec paiement

## En cas de contestation

Le voyageur peut contester un débit auprès de sa banque. Garde le **contrat signé**, des **photos de l'état des lieux** et les **devis ou factures** des réparations.
