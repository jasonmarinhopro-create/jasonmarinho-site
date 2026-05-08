---
title: "Encaisser le loyer et bloquer la caution"
excerpt: "Loyer capturé immédiatement, caution bloquée puis libérée ou capturée selon le cas."
order: 3
relatedPages: [/dashboard/calendrier]
updatedAt: "2026-05-08"
---

## Loyer et caution : deux logiques différentes

Une fois ton compte Stripe connecté, le dashboard te permet d'encaisser deux types de paiements distincts.

### Le loyer — capture immédiate

Le loyer est **encaissé immédiatement** quand le voyageur paie. Il arrive sur ton compte bancaire sous **2 à 7 jours ouvrés** (délai standard Stripe pour un nouveau compte, plus rapide ensuite).

### La caution — capture manuelle

La caution est **bloquée** sur la carte du voyageur (autorisation de prélèvement) mais **pas encaissée**. Tu as **jusqu'à 7 jours après le séjour** pour :

- **Libérer** la caution si tout va bien (le voyageur ne voit aucun débit)
- **Capturer** tout ou partie si tu dois déduire des dégâts

> C'est exactement le même mécanisme qu'un hôtel qui bloque la carte à l'arrivée et débite les extras à la fin.

---

## Étape 1 — Envoyer le lien de paiement au voyageur

Depuis la **fiche séjour** :

1. Clique sur **Envoyer le lien de paiement**
2. Choisis **Loyer**, **Caution** ou **Loyer + Caution** (les deux séparés)
3. Le voyageur reçoit un email avec un lien Stripe Checkout sécurisé

## Étape 2 — Le voyageur paie

Le voyageur :

- Ouvre le lien (pas besoin de compte Stripe)
- Entre sa **carte bancaire**
- Valide le paiement
- Reçoit une confirmation par email

Tu vois le paiement en **temps réel** dans ton dashboard Jason Marinho et dans ton dashboard Stripe.

---

## Gérer la caution après le séjour

Quand le séjour est terminé, tu as **7 jours** pour décider du sort de la caution.

### Cas 1 — Tout va bien : libérer la caution

1. Dans la fiche du séjour, va dans **Caution**
2. Clique sur **Libérer la caution**
3. La caution se libère automatiquement, le voyageur ne voit aucun débit
4. Si ce n'est pas fait dans les 7 jours, **Stripe libère automatiquement**

### Cas 2 — Dégâts : capturer une partie

1. Évalue les dégâts (avec photos, devis)
2. Dans la fiche, va dans **Caution** → **Capturer partiellement**
3. Saisis le montant à capturer (ex: 80€ pour une vaisselle cassée)
4. Justifie dans la description (visible par le voyageur)
5. Confirme

> Le voyageur reçoit un email automatique avec le détail. Le reste de la caution est libéré.

### Cas 3 — Dégâts importants : capturer la totalité

1. Va dans **Caution** → **Capturer la totalité**
2. Justifie en détail (cette justification est ta preuve juridique)
3. Confirme

> En cas de litige, le voyageur peut contester via Stripe (procédure de chargeback). Tu auras besoin du **contrat signé** + **photos d'état des lieux** + **devis professionnels** pour gagner.

---

## Suivre l'historique des paiements

Dans la sidebar → **Revenus** (plan Standard+) ou directement sur **Stripe Dashboard** (stripe.com), tu vois :

- Tous les **paiements reçus** (loyers)
- Toutes les **autorisations en cours** (cautions bloquées)
- Tous les **versements** vers ton compte bancaire
- Les **frais Stripe** prélevés

---

## Bon à savoir

> La caution Stripe a une **limite** : elle est valable **7 jours maximum** sur la carte du voyageur. Si tu prévois un séjour de 14 jours, **bloque la caution dès la veille de l'arrivée**, pas 1 mois avant.

Pour les séjours plus longs (>7 jours), tu peux :

- Demander la caution par **virement** (en plus ou au lieu de Stripe)
- Faire **renouveler** l'autorisation à mi-séjour (le voyageur reçoit un nouveau lien)
