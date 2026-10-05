---
title: "Suivre tes contrats et paiements"
excerpt: "La page Contrats & paiements : ses 3 onglets (contrats, paiements, cautions) et ce qui reste à faire."
order: 4
relatedPages: [/dashboard/contrats]
updatedAt: "2026-10-05"
---

## En haut de la page

L'encadré de droite résume ce qui attend une action et l'état de ton **encaissement** : Stripe connecté (loyer par lien de paiement et caution par empreinte), ou pas encore, avec le lien pour le connecter depuis Mon compte.

## Les 3 onglets

- **Contrats** : ce qui reste à faire et la liste de tous tes contrats
- **Paiements** : ton solde Stripe, les prochains virements, les loyers encaissés et ceux à relancer (bouton **Renvoyer le lien**)
- **Cautions** : toutes tes cautions rangées par ce qu'il reste à faire. **À décider** (carte bloquée) avec **Libérer** et **Retenir une somme** directement sur la ligne, **En attente du voyageur** (avec **Copier le lien**), puis les cautions terminées. Sans Stripe connecté, la caution se gère hors de l'app (espèces, virement)

Un chiffre à côté d'un onglet indique ce qui attend une action.

## Le bloc « À traiter »

Juste en dessous, seulement quand il y a quelque chose à faire :

- **À faire signer** : contrats envoyés mais pas encore signés, avec **Copier le lien** pour relancer
- **Loyer pas encore encaissé** : contrats signés dont le paiement en ligne n'est pas arrivé (ou a échoué)
- **Caution à traiter** : caution bloquée à libérer ou à retenir (séjour terminé ou date limite atteinte), ou caution expirée dont il faut renvoyer le lien

Les plus urgents apparaissent aussi sur l'Accueil, dans « À faire aujourd'hui ».

## Tous tes contrats

Sous ce bloc, la liste complète avec quelques chiffres (contrats, signés, à signer, loyers des contrats signés), filtrable par statut, période et logement, avec l'état du loyer et de la caution. L'œil ouvre le contrat. Le nom renvoie à la fiche du voyageur, où chaque séjour a ses boutons : **Voir le contrat**, **Loyer et caution**, **Facture**, **PDF**, puis **Checklist** et **Incidents**. Modifier, annuler ou supprimer le séjour se trouvent dans le menu « ⋮ » de la carte.

## Les statuts d'un contrat

| Statut | Signification |
|---|---|
| À signer | Envoyé, pas encore signé |
| Signé | Signé par le voyageur |
| Annulé | Annulé par toi, ou automatiquement (séjour supprimé, autre contrat signé pour le même séjour) |

## Annuler un contrat

Sur la ligne du contrat, le bouton **Annuler** (cercle barré) le passe en « Annulé ». Le lien de signature affiche alors « contrat annulé » : plus de signature ni de paiement possible. Rien n'est supprimé.

- Contrat **déjà signé et payé** : l'annulation ne rembourse rien automatiquement. Rembourse depuis ton espace Stripe, et libère la caution bloquée depuis l'onglet **Cautions**.
- **Contrats en double** : dès que le voyageur signe un contrat, les autres contrats non signés du même séjour (même logement, mêmes dates) sont annulés automatiquement.

## Un contrat annulé par erreur

Un contrat passe aussi en « Annulé » si tu supprimes son séjour ou sa ligne dans le journal des revenus. Sur la ligne du contrat, le bouton **Réactiver** le remet en « Signé » (s'il avait été signé) ou en « À signer ».

## Le PDF du contrat signé

Fiche du voyageur → bouton **PDF** du séjour. Le PDF reprend le contrat, la signature, la date et l'heure de signature. Garde-le : c'est ta preuve en cas de litige.
