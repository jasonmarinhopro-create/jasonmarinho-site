// Traductions des emails envoyés au LOCATAIRE au sujet d'un contrat
// (invitation à signer, confirmation de signature). Suit contracts.langue
// (fr ou pt, choisi à la création dans ContractModal.tsx) — même logique
// que le corps du contrat sur /sign/[token]. Les emails envoyés au
// BAILLEUR (Jason ou l'hôte) restent toujours en français : c'est lui qui
// utilise le dashboard en français, indépendamment de la langue du contrat.

export type EmailLang = 'fr' | 'pt'

export function toEmailLang(langue: string | null | undefined): EmailLang {
  return langue === 'pt' ? 'pt' : 'fr'
}

export const CONTRACT_EMAIL_I18N: Record<EmailLang, {
  inviteSubject: (property: string) => string
  inviteTitle: string
  invitePreview: (host: string, property: string) => string
  inviteGreeting: (guest: string) => string
  inviteBody: (host: string) => string
  labelLogement: string
  labelAdresse: string
  labelArrivee: string
  labelDepart: string
  inviteBtn: string
  inviteNote: string

  signedSubject: (property: string) => string
  signedTitle: string
  signedPreview: (property: string) => string
  signedGreeting: (guest: string) => string
  signedBody: (property: string, date: string) => string
  labelSigned: string
  labelIp: string
  finalizeTitle: string
  payBookingBtn: (amount: string) => string
  payDepositBtn: (amount: string) => string
  depositNote: string
  bankTransferTitle: string
  bankTransferLabelIban: string
  bankTransferLabelBic: string
  bankTransferLabelBeneficiaire: string
  bankTransferLabelMontant: string
  bankTransferLabelReference: string
  bankTransferNote: string
  viewContractBtn: string
  eidasNote: string

  reminderPreheader: string
  reminderTitle: string
  reminderGreeting: (guest: string) => string
  reminderBody: (property: string) => string
  reminderPaymentsIntro: (multiple: boolean) => string
  reminderVirementIntro: string
  reminderClickToPay: string
  reminderSelectToCopy: string
  reminderTroubleNote: string
  reminderSubject: (property: string) => string
}> = {
  fr: {
    inviteSubject: property => `Contrat à signer, ${property}`,
    inviteTitle: 'Contrat de location',
    invitePreview: (host, property) => `${host} vous invite à signer votre contrat pour ${property}.`,
    inviteGreeting: guest => `Bonjour <strong style="color:#e8ede8;">${guest}</strong>,`,
    inviteBody: host => `<strong style="color:#e8ede8;">${host}</strong> vous invite à lire et signer votre contrat de location.`,
    labelLogement: 'Logement',
    labelAdresse: 'Adresse',
    labelArrivee: 'Arrivée',
    labelDepart: 'Départ',
    inviteBtn: 'Lire et signer le contrat',
    inviteNote: "Ce lien est valable 30 jours. La signature constitue une signature électronique simple au sens du règlement eIDAS (UE) 910/2014, juridiquement valable en France et dans l'Union Européenne.",

    signedSubject: property => `Contrat signé, finalisez votre dossier pour ${property}`,
    signedTitle: 'Votre contrat est signé',
    signedPreview: property => `Signature confirmée pour ${property}.`,
    signedGreeting: guest => `Bonjour <strong style="color:#e8ede8;">${guest}</strong>,`,
    signedBody: (property, date) => `Votre contrat de location pour <strong style="color:#e8ede8;">${property}</strong> a été signé le <strong style="color:#e8ede8;">${date}</strong>.`,
    labelSigned: 'Signé le',
    labelIp: 'Adresse IP',
    finalizeTitle: 'FINALISER LE DOSSIER',
    payBookingBtn: amount => `Payer la réservation, ${amount} €`,
    payDepositBtn: amount => `Régler la caution, ${amount} €`,
    depositNote: "La caution est bloquée sur votre carte et libérée après votre séjour si aucun dommage n'est constaté.",
    bankTransferTitle: 'VIREMENT BANCAIRE',
    bankTransferLabelIban: 'IBAN',
    bankTransferLabelBic: 'BIC',
    bankTransferLabelBeneficiaire: 'Bénéficiaire',
    bankTransferLabelMontant: 'Montant',
    bankTransferLabelReference: 'Référence',
    bankTransferNote: "Indiquez la référence dans le libellé du virement. Prévenez le propriétaire une fois le virement effectué.",
    viewContractBtn: 'Accéder au contrat signé',
    eidasNote: "Ce contrat constitue une signature électronique simple au sens du règlement eIDAS (UE) 910/2014 et de l'article 1366 du Code civil français.",

    reminderPreheader: 'Rappel, Dossier à finaliser',
    reminderTitle: 'Finalisez votre dossier',
    reminderGreeting: guest => `Bonjour <strong style="color:#f0ebe1;">${guest}</strong>,`,
    reminderBody: property => `Votre contrat de location pour <strong style="color:#f0ebe1;">${property}</strong> a bien été signé.`,
    reminderPaymentsIntro: multiple => multiple ? 'Il reste à effectuer les paiements suivants pour confirmer définitivement votre séjour :' : 'Il reste à effectuer le paiement suivant pour confirmer définitivement votre séjour :',
    reminderVirementIntro: 'Voici les coordonnées bancaires pour effectuer votre règlement :',
    reminderClickToPay: 'Cliquez sur le bouton correspondant pour effectuer votre paiement en ligne :',
    reminderSelectToCopy: 'Appuyez sur chaque champ pour le sélectionner, puis copiez-le :',
    reminderTroubleNote: 'En cas de difficulté, contactez directement votre propriétaire.',
    reminderSubject: property => `Rappel, Finalisez votre dossier pour ${property}`,
  },
  pt: {
    inviteSubject: property => `Contrato para assinar, ${property}`,
    inviteTitle: 'Contrato de arrendamento',
    invitePreview: (host, property) => `${host} convida-o(a) a assinar o seu contrato para ${property}.`,
    inviteGreeting: guest => `Olá <strong style="color:#e8ede8;">${guest}</strong>,`,
    inviteBody: host => `<strong style="color:#e8ede8;">${host}</strong> convida-o(a) a ler e assinar o seu contrato de arrendamento.`,
    labelLogement: 'Alojamento',
    labelAdresse: 'Endereço',
    labelArrivee: 'Chegada',
    labelDepart: 'Partida',
    inviteBtn: 'Ler e assinar o contrato',
    inviteNote: 'Este link é válido durante 30 dias. A assinatura constitui uma assinatura eletrónica simples nos termos do Regulamento eIDAS (UE) 910/2014, juridicamente válida em França e na União Europeia.',

    signedSubject: property => `Contrato assinado, finalize o seu processo para ${property}`,
    signedTitle: 'O seu contrato está assinado',
    signedPreview: property => `Assinatura confirmada para ${property}.`,
    signedGreeting: guest => `Olá <strong style="color:#e8ede8;">${guest}</strong>,`,
    signedBody: (property, date) => `O seu contrato de arrendamento para <strong style="color:#e8ede8;">${property}</strong> foi assinado em <strong style="color:#e8ede8;">${date}</strong>.`,
    labelSigned: 'Assinado em',
    labelIp: 'Endereço IP',
    finalizeTitle: 'FINALIZAR O PROCESSO',
    payBookingBtn: amount => `Pagar a reserva, ${amount} €`,
    payDepositBtn: amount => `Pagar a caução, ${amount} €`,
    depositNote: 'A caução fica bloqueada no seu cartão e é libertada após a sua estadia caso não seja constatado qualquer dano.',
    bankTransferTitle: 'TRANSFERÊNCIA BANCÁRIA',
    bankTransferLabelIban: 'IBAN',
    bankTransferLabelBic: 'BIC',
    bankTransferLabelBeneficiaire: 'Beneficiário',
    bankTransferLabelMontant: 'Valor',
    bankTransferLabelReference: 'Referência',
    bankTransferNote: 'Indique a referência na transferência. Avise o proprietário assim que a transferência for efetuada.',
    viewContractBtn: 'Aceder ao contrato assinado',
    eidasNote: 'Este contrato constitui uma assinatura eletrónica simples nos termos do Regulamento eIDAS (UE) 910/2014.',

    reminderPreheader: 'Lembrete, Processo por finalizar',
    reminderTitle: 'Finalize o seu processo',
    reminderGreeting: guest => `Olá <strong style="color:#f0ebe1;">${guest}</strong>,`,
    reminderBody: property => `O seu contrato de arrendamento para <strong style="color:#f0ebe1;">${property}</strong> foi assinado com sucesso.`,
    reminderPaymentsIntro: multiple => multiple ? 'Falta ainda efetuar os seguintes pagamentos para confirmar definitivamente a sua estadia:' : 'Falta ainda efetuar o seguinte pagamento para confirmar definitivamente a sua estadia:',
    reminderVirementIntro: 'Aqui estão os dados bancários para efetuar o pagamento:',
    reminderClickToPay: 'Clique no botão correspondente para efetuar o seu pagamento online:',
    reminderSelectToCopy: 'Toque em cada campo para o selecionar e depois copie-o:',
    reminderTroubleNote: 'Em caso de dificuldade, contacte diretamente o seu anfitrião.',
    reminderSubject: property => `Lembrete, finalize o seu processo para ${property}`,
  },
}
