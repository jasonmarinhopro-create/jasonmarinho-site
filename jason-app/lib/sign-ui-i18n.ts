// Traductions de l'interface (hors corps légal du contrat, cf. contract-templates.ts)
// pour la page /sign/[token] et ses sous-composants (paiement, caution, IBAN).
// Le corps du contrat est toujours affiché dans la langue choisie (fr ou pt)
// PUIS en anglais en complément (cf. page.tsx) — ce dictionnaire fournit les
// 3 langues pour permettre ce rendu bilingue.

export type UiLang = 'fr' | 'pt' | 'en'

export type SignUiStrings = {
  badgeSigned: string
  badgeCancelled: string
  badgeExpired: string
  badgePending: string
  contractTitle1: string
  contractTitle2: string
  eidasNote: string
  boundByLaw: string
  signedBanner: string
  signedBannerSub: (date: string) => string
  expiredBanner: string
  expiredBannerSub: string
  cancelledBanner: string
  art1: string
  bailleurLabel: string
  locataireLabel: string
  art2: string
  bienLoueIntro: string
  addressMissing: string
  capaciteMax: (n: number) => string
  petsAndSmoking: (pets: boolean, smoke: boolean) => string
  art3: string
  arrivee: string
  from: string
  depart: string
  before: string
  nights: (n: number) => string
  art4: string
  loyerTotal: string
  deposit: string
  depositRefund: string
  acompte: (pct: number) => string
  acompteHint: string
  solde: string
  soldeHint: string
  paymentTerms: string
  bankDetails: string
  beneficiary: string
  copy: string
  copied: string
  payByTransfer: string
  transferHint: string
  amountLabel: string
  amountPartialLabel: string
  referenceLabel: string
  soldeRemainingNote: (amount: string) => string
  transferNotice: string
  depositRegistered: string
  depositRegisteredHint: (amount: string) => string
  depositCancelled: string
  depositCancelledHint: string
  depositRequired: string
  depositRequiredHint: (amount: string) => string
  depositCardNote: string
  payDeposit: (amount: string) => string
  redirecting: string
  networkError: string
  paymentError: string
  paymentDoneTitle: (isPartial: boolean) => string
  paymentDoneHint: (amount: string, isPartial: boolean) => string
  paymentCancelledTitle: string
  paymentCancelledHint: (isPartial: boolean) => string
  payTitle: (isPartial: boolean) => string
  payHint1: (amount: string, isPartial: boolean) => string
  payHint2: string
  payButton: (amount: string, isPartial: boolean) => string
  art5: string
  art6: string
  art7: string
  bailleurCommit: string
  locataireCommit: string
  capaciteReminder: (n: number) => string
  foreignGuestDeclaration: string
  art8: string
  art9: string
  art10: string
  ownerLockedTitle: string
  ownerLockedText: string
  finalizeTitle: string
  signedBy: string
  signedOn: (date: string) => string
  footerLine1: string
  footerRef: (ref: string, date: string) => string
  yes: string
  no: string
  petsAllowed: string
  smokingAllowed: string
  smokingForbidden: string
}

export const SIGN_UI: Record<UiLang, SignUiStrings> = {
  fr: {
    badgeSigned: 'Signé ✓',
    badgeCancelled: 'Annulé',
    badgeExpired: 'Expiré',
    badgePending: 'En attente de signature',
    contractTitle1: 'Contrat de location',
    contractTitle2: 'saisonnière',
    eidasNote: 'Signature électronique valide selon le règlement eIDAS (UE) 910/2014.',
    boundByLaw: 'Contrat soumis au droit',
    signedBanner: 'Ce contrat a été signé électroniquement',
    signedBannerSub: date => `Signé le ${date}, Les deux parties ont reçu une confirmation par email.`,
    expiredBanner: 'Ce lien de signature a expiré',
    expiredBannerSub: 'Contactez le propriétaire pour obtenir un nouveau lien.',
    cancelledBanner: 'Ce contrat a été annulé.',
    art1: 'Article 1, Parties au contrat',
    bailleurLabel: 'Bailleur (propriétaire)',
    locataireLabel: 'Locataire',
    art2: 'Article 2, Bien loué',
    bienLoueIntro: "Le bailleur loue au locataire le bien immobilier situé à l'adresse suivante :",
    addressMissing: 'Adresse non renseignée',
    capaciteMax: n => `Capacité maximale d'occupation : ${n} personne${n > 1 ? 's' : ''}.`,
    petsAndSmoking: () => '',
    art3: 'Article 3, Durée de la location',
    arrivee: 'Arrivée',
    from: 'à partir de',
    depart: 'Départ',
    before: 'avant',
    nights: n => `${n} nuit${n > 1 ? 's' : ''}`,
    art4: 'Article 4, Prix et modalités de paiement',
    loyerTotal: 'Loyer total',
    deposit: 'Dépôt de garantie',
    depositRefund: "remboursé sous 30 jours après l'état des lieux",
    acompte: pct => `Acompte (${pct}%)`,
    acompteHint: 'à régler pour confirmer la réservation',
    solde: 'Solde',
    soldeHint: "à régler à l'arrivée",
    paymentTerms: 'Modalités de paiement :',
    bankDetails: 'Coordonnées bancaires',
    beneficiary: 'Bénéficiaire',
    copy: 'Copier',
    copied: 'Copié !',
    payByTransfer: 'Payer par virement bancaire',
    transferHint: 'Effectuez un virement depuis votre banque avec les coordonnées ci-dessous. Indiquez bien la référence pour que le propriétaire identifie votre paiement.',
    amountLabel: 'Montant',
    amountPartialLabel: 'Montant (acompte)',
    referenceLabel: 'Référence',
    soldeRemainingNote: amount => `Solde restant de ${amount} à régler directement au propriétaire à votre arrivée.`,
    transferNotice: 'Une fois le virement effectué, prévenez le propriétaire par email ou téléphone. Les virements peuvent prendre 1 à 3 jours ouvrés selon votre banque.',
    depositRegistered: 'Caution enregistrée',
    depositRegisteredHint: amount => `${amount} bloqués sur votre carte. Cette somme sera libérée par le propriétaire après votre séjour si aucun dommage n'est constaté.`,
    depositCancelled: 'Paiement de la caution annulé',
    depositCancelledHint: 'Vous pouvez régler la caution ci-dessous pour finaliser votre dossier.',
    depositRequired: 'Dépôt de garantie requis',
    depositRequiredHint: amount => `Pour finaliser votre séjour, un dépôt de garantie de ${amount} est demandé par le propriétaire.`,
    depositCardNote: "Votre carte sera bloquée mais pas débitée, la somme n'est encaissée qu'en cas de dommages constatés à la fin du séjour.",
    payDeposit: amount => `Régler la caution, ${amount} →`,
    redirecting: 'Redirection vers Stripe…',
    networkError: 'Erreur réseau. Réessayez.',
    paymentError: 'Erreur lors du paiement.',
    paymentDoneTitle: isPartial => isPartial ? 'Acompte réglé' : 'Réservation réglée',
    paymentDoneHint: (amount, isPartial) => `${amount} reçus par le propriétaire. Votre réservation est confirmée${isPartial ? ', le solde reste à régler à votre arrivée' : ''}.`,
    paymentCancelledTitle: 'Paiement annulé',
    paymentCancelledHint: isPartial => `Vous pouvez régler ${isPartial ? 'votre acompte' : 'votre réservation'} ci-dessous pour la finaliser.`,
    payTitle: isPartial => isPartial ? 'Réglez votre acompte' : 'Réglez votre réservation',
    payHint1: (amount, isPartial) => `Pour confirmer votre séjour, réglez en ligne ${amount} directement par carte bancaire.${isPartial ? ' Le solde restant est à régler directement au propriétaire à votre arrivée.' : ''}`,
    payHint2: 'Le paiement est sécurisé par Stripe et votre carte est débitée immédiatement. Vous recevrez une confirmation par email.',
    payButton: (amount, isPartial) => `Payer ${isPartial ? "l'acompte" : 'la réservation'}, ${amount} →`,
    art5: "Article 5, Conditions d'annulation",
    art6: 'Article 6, Règlement intérieur',
    art7: 'Article 7, Obligations des parties',
    bailleurCommit: "Le bailleur s'engage à :",
    locataireCommit: "Le locataire s'engage à :",
    capaciteReminder: n => `(Capacité maximale : ${n} personne${n > 1 ? 's' : ''}.)`,
    foreignGuestDeclaration: 'Déclaration des voyageurs étrangers :',
    art8: 'Article 8, Protection des données personnelles (RGPD)',
    art9: 'Article 9, Loi applicable et juridiction',
    art10: 'Article 10, Valeur juridique de la signature électronique',
    ownerLockedTitle: 'Vous êtes le propriétaire-bailleur',
    ownerLockedText: "Ce lien est destiné à votre locataire pour qu'il signe. Transmettez-le par email ou message.",
    finalizeTitle: 'Finaliser votre dossier',
    signedBy: 'Signé par',
    signedOn: date => `Le ${date}`,
    footerLine1: "Contrat établi via jasonmarinho.com, Conforme au Code civil, au Code du tourisme et au règlement eIDAS (UE) 910/2014.",
    footerRef: (ref, date) => `Référence : ${ref}, Créé le ${date}`,
    yes: 'Oui', no: 'Non', petsAllowed: 'Animaux admis',
    smokingAllowed: 'Tabac autorisé', smokingForbidden: 'Tabac interdit',
  },
  pt: {
    badgeSigned: 'Assinado ✓',
    badgeCancelled: 'Cancelado',
    badgeExpired: 'Expirado',
    badgePending: 'Aguarda assinatura',
    contractTitle1: 'Contrato de arrendamento',
    contractTitle2: 'de curta duração',
    eidasNote: 'Assinatura eletrónica válida nos termos do Regulamento eIDAS (UE) 910/2014.',
    boundByLaw: 'Contrato sujeito ao direito',
    signedBanner: 'Este contrato foi assinado eletronicamente',
    signedBannerSub: date => `Assinado em ${date}. Ambas as partes receberam uma confirmação por e-mail.`,
    expiredBanner: 'Este link de assinatura expirou',
    expiredBannerSub: 'Contacte o proprietário para obter um novo link.',
    cancelledBanner: 'Este contrato foi cancelado.',
    art1: 'Artigo 1, Partes no contrato',
    bailleurLabel: 'Senhorio (proprietário)',
    locataireLabel: 'Hóspede',
    art2: 'Artigo 2, Imóvel arrendado',
    bienLoueIntro: 'O senhorio arrenda ao hóspede o imóvel situado no seguinte endereço :',
    addressMissing: 'Endereço não indicado',
    capaciteMax: n => `Capacidade máxima de ocupação : ${n} pessoa${n > 1 ? 's' : ''}.`,
    petsAndSmoking: () => '',
    art3: 'Artigo 3, Duração da estadia',
    arrivee: 'Chegada',
    from: 'a partir das',
    depart: 'Partida',
    before: 'até às',
    nights: n => `${n} noite${n > 1 ? 's' : ''}`,
    art4: 'Artigo 4, Preço e condições de pagamento',
    loyerTotal: 'Valor total',
    deposit: 'Caução',
    depositRefund: 'reembolsada no prazo de 30 dias após a verificação do imóvel',
    acompte: pct => `Sinal (${pct}%)`,
    acompteHint: 'a pagar para confirmar a reserva',
    solde: 'Saldo',
    soldeHint: 'a pagar na chegada',
    paymentTerms: 'Formas de pagamento :',
    bankDetails: 'Dados bancários',
    beneficiary: 'Beneficiário',
    copy: 'Copiar',
    copied: 'Copiado!',
    payByTransfer: 'Pagar por transferência bancária',
    transferHint: 'Faça uma transferência a partir do seu banco com os dados abaixo. Indique bem a referência para que o proprietário identifique o seu pagamento.',
    amountLabel: 'Valor',
    amountPartialLabel: 'Valor (sinal)',
    referenceLabel: 'Referência',
    soldeRemainingNote: amount => `Saldo remanescente de ${amount} a pagar diretamente ao proprietário na sua chegada.`,
    transferNotice: 'Depois de efetuar a transferência, avise o proprietário por e-mail ou telefone. As transferências podem demorar de 1 a 3 dias úteis, consoante o seu banco.',
    depositRegistered: 'Caução registada',
    depositRegisteredHint: amount => `${amount} bloqueados no seu cartão. Este valor será libertado pelo proprietário após a sua estadia, caso não seja constatado qualquer dano.`,
    depositCancelled: 'Pagamento da caução cancelado',
    depositCancelledHint: 'Pode pagar a caução abaixo para finalizar o seu processo.',
    depositRequired: 'Caução necessária',
    depositRequiredHint: amount => `Para finalizar a sua estadia, é pedida pelo proprietário uma caução de ${amount}.`,
    depositCardNote: 'O seu cartão será bloqueado mas não debitado; o valor só é cobrado em caso de danos constatados no final da estadia.',
    payDeposit: amount => `Pagar a caução, ${amount} →`,
    redirecting: 'A redirecionar para o Stripe…',
    networkError: 'Erro de rede. Tente novamente.',
    paymentError: 'Erro no pagamento.',
    paymentDoneTitle: isPartial => isPartial ? 'Sinal pago' : 'Reserva paga',
    paymentDoneHint: (amount, isPartial) => `${amount} recebidos pelo proprietário. A sua reserva está confirmada${isPartial ? ', o saldo fica a pagar na sua chegada' : ''}.`,
    paymentCancelledTitle: 'Pagamento cancelado',
    paymentCancelledHint: isPartial => `Pode pagar ${isPartial ? 'o seu sinal' : 'a sua reserva'} abaixo para a finalizar.`,
    payTitle: isPartial => isPartial ? 'Pague o seu sinal' : 'Pague a sua reserva',
    payHint1: (amount, isPartial) => `Para confirmar a sua estadia, pague online ${amount} diretamente por cartão bancário.${isPartial ? ' O saldo restante é pago diretamente ao proprietário na sua chegada.' : ''}`,
    payHint2: 'O pagamento é seguro através do Stripe e o seu cartão é debitado de imediato. Receberá uma confirmação por e-mail.',
    payButton: (amount, isPartial) => `Pagar ${isPartial ? 'o sinal' : 'a reserva'}, ${amount} →`,
    art5: 'Artigo 5, Condições de cancelamento',
    art6: 'Artigo 6, Regulamento interno',
    art7: 'Artigo 7, Obrigações das partes',
    bailleurCommit: 'O senhorio compromete-se a :',
    locataireCommit: 'O hóspede compromete-se a :',
    capaciteReminder: n => `(Capacidade máxima : ${n} pessoa${n > 1 ? 's' : ''}.)`,
    foreignGuestDeclaration: 'Declaração de hóspedes estrangeiros :',
    art8: 'Artigo 8, Proteção de dados pessoais (RGPD)',
    art9: 'Artigo 9, Lei aplicável e jurisdição',
    art10: 'Artigo 10, Valor jurídico da assinatura eletrónica',
    ownerLockedTitle: 'É o proprietário-senhorio',
    ownerLockedText: 'Este link destina-se ao seu hóspede para que assine. Envie-o por e-mail ou mensagem.',
    finalizeTitle: 'Finalizar o seu processo',
    signedBy: 'Assinado por',
    signedOn: date => `Em ${date}`,
    footerLine1: 'Contrato gerado através de jasonmarinho.com, em conformidade com o Regulamento eIDAS (UE) 910/2014.',
    footerRef: (ref, date) => `Referência : ${ref}, Criado em ${date}`,
    yes: 'Sim', no: 'Não', petsAllowed: 'Animais admitidos',
    smokingAllowed: 'Fumar permitido', smokingForbidden: 'Proibido fumar',
  },
  en: {
    badgeSigned: 'Signed ✓',
    badgeCancelled: 'Cancelled',
    badgeExpired: 'Expired',
    badgePending: 'Awaiting signature',
    contractTitle1: 'Short-term rental',
    contractTitle2: 'agreement',
    eidasNote: 'Electronic signature valid under the eIDAS Regulation (EU) 910/2014.',
    boundByLaw: 'Contract governed by',
    signedBanner: 'This contract has been signed electronically',
    signedBannerSub: date => `Signed on ${date}. Both parties have received a confirmation email.`,
    expiredBanner: 'This signing link has expired',
    expiredBannerSub: 'Contact the owner to get a new link.',
    cancelledBanner: 'This contract has been cancelled.',
    art1: 'Article 1, Parties to the contract',
    bailleurLabel: 'Landlord (owner)',
    locataireLabel: 'Tenant',
    art2: 'Article 2, Rented property',
    bienLoueIntro: 'The landlord rents to the tenant the property located at the following address:',
    addressMissing: 'Address not provided',
    capaciteMax: n => `Maximum occupancy: ${n} guest${n > 1 ? 's' : ''}.`,
    petsAndSmoking: () => '',
    art3: 'Article 3, Length of stay',
    arrivee: 'Arrival',
    from: 'from',
    depart: 'Departure',
    before: 'before',
    nights: n => `${n} night${n > 1 ? 's' : ''}`,
    art4: 'Article 4, Price and payment terms',
    loyerTotal: 'Total rent',
    deposit: 'Security deposit',
    depositRefund: 'refunded within 30 days after the check-out inspection',
    acompte: pct => `Deposit (${pct}%)`,
    acompteHint: 'to be paid to confirm the booking',
    solde: 'Balance',
    soldeHint: 'to be paid on arrival',
    paymentTerms: 'Payment methods:',
    bankDetails: 'Bank details',
    beneficiary: 'Beneficiary',
    copy: 'Copy',
    copied: 'Copied!',
    payByTransfer: 'Pay by bank transfer',
    transferHint: 'Make a transfer from your bank using the details below. Be sure to include the reference so the owner can identify your payment.',
    amountLabel: 'Amount',
    amountPartialLabel: 'Amount (deposit)',
    referenceLabel: 'Reference',
    soldeRemainingNote: amount => `Remaining balance of ${amount} to be paid directly to the owner on arrival.`,
    transferNotice: 'Once the transfer is done, let the owner know by email or phone. Transfers can take 1 to 3 business days depending on your bank.',
    depositRegistered: 'Security deposit registered',
    depositRegisteredHint: amount => `${amount} held on your card. This amount will be released by the owner after your stay if no damage is found.`,
    depositCancelled: 'Security deposit payment cancelled',
    depositCancelledHint: 'You can pay the security deposit below to finalise your file.',
    depositRequired: 'Security deposit required',
    depositRequiredHint: amount => `To finalise your stay, the owner requires a security deposit of ${amount}.`,
    depositCardNote: 'Your card will be authorised but not charged; the amount is only collected if damage is found at the end of the stay.',
    payDeposit: amount => `Pay the security deposit, ${amount} →`,
    redirecting: 'Redirecting to Stripe…',
    networkError: 'Network error. Please try again.',
    paymentError: 'Payment error.',
    paymentDoneTitle: isPartial => isPartial ? 'Deposit paid' : 'Booking paid',
    paymentDoneHint: (amount, isPartial) => `${amount} received by the owner. Your booking is confirmed${isPartial ? ', the balance remains to be paid on arrival' : ''}.`,
    paymentCancelledTitle: 'Payment cancelled',
    paymentCancelledHint: isPartial => `You can pay ${isPartial ? 'your deposit' : 'your booking'} below to finalise it.`,
    payTitle: isPartial => isPartial ? 'Pay your deposit' : 'Pay your booking',
    payHint1: (amount, isPartial) => `To confirm your stay, pay ${amount} online directly by card.${isPartial ? ' The remaining balance is to be paid directly to the owner on arrival.' : ''}`,
    payHint2: 'Payment is secured by Stripe and your card is charged immediately. You will receive a confirmation email.',
    payButton: (amount, isPartial) => `Pay ${isPartial ? 'the deposit' : 'the booking'}, ${amount} →`,
    art5: 'Article 5, Cancellation terms',
    art6: 'Article 6, House rules',
    art7: 'Article 7, Obligations of the parties',
    bailleurCommit: 'The landlord agrees to:',
    locataireCommit: 'The tenant agrees to:',
    capaciteReminder: n => `(Maximum occupancy: ${n} guest${n > 1 ? 's' : ''}.)`,
    foreignGuestDeclaration: 'Foreign guest declaration:',
    art8: 'Article 8, Personal data protection (GDPR)',
    art9: 'Article 9, Governing law and jurisdiction',
    art10: 'Article 10, Legal value of the electronic signature',
    ownerLockedTitle: 'You are the landlord',
    ownerLockedText: 'This link is meant for your tenant to sign. Share it by email or message.',
    finalizeTitle: 'Finalise your file',
    signedBy: 'Signed by',
    signedOn: date => `On ${date}`,
    footerLine1: 'Contract generated via jasonmarinho.com, compliant with the eIDAS Regulation (EU) 910/2014.',
    footerRef: (ref, date) => `Reference: ${ref}, Created on ${date}`,
    yes: 'Yes', no: 'No', petsAllowed: 'Pets allowed',
    smokingAllowed: 'Smoking allowed', smokingForbidden: 'No smoking',
  },
}

const LOCALES: Record<UiLang, string> = { fr: 'fr-FR', pt: 'pt-PT', en: 'en-GB' }

export function formatDateLang(d: string, lang: UiLang) {
  return new Date(d).toLocaleDateString(LOCALES[lang], { day: 'numeric', month: 'long', year: 'numeric' })
}

export function toUiLang(langue: string | null | undefined): UiLang {
  return langue === 'pt' ? 'pt' : 'fr'
}
