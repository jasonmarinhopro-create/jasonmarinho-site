---
title: "Encaisser le loyer et gérer la caution"
excerpt: "Le paiement du loyer, la caution bloquée sur la carte, puis libérée ou encaissée."
order: 3
relatedPages: [/dashboard/contrats, /dashboard/voyageurs]
updatedAt: "2026-09-27"
---

## Le loyer

Si le contrat prévoit un paiement **Stripe**, le voyageur reçoit le lien de paiement après sa signature. Le loyer est encaissé tout de suite et arrive sur ton compte bancaire selon le calendrier de versement de Stripe.

Si tu as choisi un **acompte de 50 %**, seul l'acompte est payé en ligne. Le solde est indiqué « à régler à l'arrivée » sur le contrat, par le moyen convenu avec le voyageur.

## La caution

La caution n'est **pas débitée** : le montant est **bloqué** sur la carte du voyageur. Après le séjour, tu choisis :

- **Libérer la caution** : le blocage est annulé, le voyageur n'est pas débité
- **Encaisser** : le montant **total** de la caution est prélevé. C'est définitif

> L'app encaisse la caution en entier. Pour retenir seulement une partie (une vaisselle cassée, par exemple), encaisse puis rembourse la différence depuis ton tableau de bord Stripe.

## Le lien part 2 jours avant l'arrivée

Stripe garde en général une carte bloquée **7 jours**, pas plus. C'est pourquoi le lien de caution ne s'ouvre que **2 jours avant l'arrivée** : ce jour-là, l'app l'envoie automatiquement par email au voyageur. Avant, la page du contrat lui indique la date.

> Source : documentation Stripe, « Place a hold on a payment method » (docs.stripe.com)

Conséquences :

- Libère ou encaisse la caution **au plus tard 4 jours après l'arrivée**. La fenêtre Paiements t'indique la date exacte
- Pour un séjour de **plus de 4 nuits**, la carte sera débloquée avant l'état des lieux de sortie : préfère une caution par virement. L'assistant de contrat te prévient
- Si le blocage tombe avant que tu aies décidé, la caution passe en **Expirée** et tu reçois une notification. Si le séjour n'est pas terminé, renvoie le lien au voyageur

## Où gérer tout ça

- **Contrats & paiements** : le bloc **À traiter** liste les loyers pas encore encaissés et les cautions à libérer
- **Fiche du voyageur** → bouton **Paiements** du séjour : état du loyer et de la caution, liens à copier, **Renvoyer l'email au voyageur**, boutons Libérer et Encaisser

## Les statuts

- **Loyer** : En attente de paiement, Réglé, Remboursé ou Échec paiement
- **Caution** : En attente de paiement, Caution retenue (la carte est bloquée), Encaissée, Libérée, Expirée ou Échec paiement

## En cas de contestation

Le voyageur peut contester un débit auprès de sa banque. Garde le **contrat signé**, des **photos de l'état des lieux** et les **devis ou factures** des réparations.
