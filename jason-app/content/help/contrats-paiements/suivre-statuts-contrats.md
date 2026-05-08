---
title: "Suivre les statuts des contrats et paiements"
excerpt: "La vue d'ensemble de tes contrats : qui a signé, qui a payé, quoi reste à faire."
order: 4
relatedPages: [/dashboard/calendrier, /dashboard/voyageurs]
updatedAt: "2026-05-08"
---

## Les statuts d'un contrat

Chaque contrat passe par plusieurs états. Tu les vois dans la fiche séjour, dans la fiche voyageur, et dans le calendrier.

| Statut | Signification | Action possible |
|--------|---------------|-----------------|
| **Brouillon** | Contrat créé, pas encore envoyé | Modifier ou envoyer |
| **En attente de signature** | Lien envoyé, en attente du voyageur | Renvoyer le lien |
| **Signé** | Contrat signé électroniquement | Télécharger le PDF |
| **Annulé** | Séjour ou contrat annulé | Archive |

---

## Les statuts d'un paiement

Pour le loyer et la caution :

| Statut | Signification |
|--------|---------------|
| **Non envoyé** | Lien de paiement pas encore envoyé |
| **En attente** | Lien envoyé, paiement en cours |
| **Loyer reçu** | Montant loyer capturé sur ton Stripe |
| **Caution bloquée** | Autorisation Stripe active sur la carte |
| **Caution libérée** | Caution restituée après séjour |
| **Caution capturée** | Retenue effectuée (dégâts, etc.) |

---

## Le calendrier comme vue globale

Dans le **Calendrier**, chaque séjour affiché montre son statut **par sa couleur** :

- 🔘 **Gris** : en attente (rien d'envoyé)
- 🟡 **Jaune** : contrat envoyé, en attente de signature
- 🟢 **Vert** : signé, paiement reçu
- 🔴 **Rouge** : annulé

Tu vois en un coup d'œil :

- Quels séjours sont **confirmés** (vert) — tu n'as rien à faire
- Quels séjours **attendent** (jaune) — relance possible
- Quels séjours sont **bloqués** (gris) — action de ta part

---

## La checklist par contrat

Dans chaque contrat, une **checklist personnalisable** te permet de suivre les étapes administratives avant le séjour :

- Contrat signé
- Caution reçue
- Pièce d'identité demandée
- Règlement intérieur envoyé
- Check-in confirmé
- (custom) Tu peux ajouter tes propres items

> Tu coches chaque item au fil du temps. La checklist est **visible depuis le calendrier** (clic sur le séjour) et depuis la fiche voyageur.

---

## Routine recommandée — chaque lundi 5 minutes

Prends 5 minutes le **lundi matin** pour vérifier ton calendrier :

1. **Filtre sur les 30 prochains jours**
2. Repère les **statuts jaunes** (contrats non signés) → relance ces voyageurs
3. Repère les **statuts gris** (rien d'envoyé) → crée et envoie les contrats
4. Pour les **séjours qui se terminent cette semaine** : prépare la décision sur la caution

> En 5 minutes par semaine, tu maîtrises ton planning des 30 prochains jours et tu n'oublies plus aucun voyageur.

---

## Téléchargement PDF du contrat signé

Une fois le contrat signé :

1. Va dans la fiche séjour → onglet **Contrat**
2. Clique sur **Télécharger PDF**

Le PDF contient :

- Le contrat complet
- La **signature électronique** du voyageur (image générée + horodatage)
- La **preuve d'horodatage** (heure UTC, IP, date)
- Le **certificat eIDAS** de validité juridique

Garde ce PDF dans tes archives. C'est ta preuve juridique en cas de litige.
