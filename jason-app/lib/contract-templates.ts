// Templates juridiques de contrat de location courte durée par pays, chacun
// disponible en français, portugais et anglais. Source d'autorité unique :
// tout ce qui change dans le contrat selon le pays et la langue vit ici.
// Ajouter un pays = ajouter une entrée avec ses 3 traductions.
//
// ⚠️ DISCLAIMER : ces templates sont fournis à titre indicatif. Pour les
// pays autres que FR (FR a fait l'objet de relectures juridiques), il est
// recommandé de faire valider le modèle par un juriste local avant un
// usage commercial régulier. Les traductions PT/EN sont des traductions
// de convenance pour la bonne compréhension du locataire : en cas de
// litige, seule la version française (droit français applicable au
// contrat par défaut) ou la version portugaise (pour un bien situé au
// Portugal) fait foi selon le droit applicable indiqué dans le contrat.
//
// Sources :
// - PT : Decreto-Lei n.º 128/2014 (régime AL), Código Civil arts.
//   1022-1029 (locação), arts. 405-406 (liberté contractuelle).
//   Règlement eIDAS (UE) 910/2014 valide PT comme FR.

import type { CountryCode } from './countries'

export type ContractLang = 'fr' | 'pt' | 'en'

export type ContractTemplate = {
  /** Sous-titre sous le titre du contrat */
  legalBasis: string
  /** Titre de la section "Bien loué" (varie peu) */
  sectionBienLoue: string
  /** Texte de la section "Obligations des parties" */
  obligationsBailleur: string
  obligationsLocataire: string
  /** Section "Loi applicable" : référence au code et juridiction compétente */
  loiApplicable: string
  /** Mention spéciale post-séjour (déclaration voyageurs étrangers, etc.) */
  declarationVoyageur: string | null
  /** Texte juridique sur la signature électronique */
  signatureElectronique: string
  /** Article RGPD (FR/UE, identique dans l'UE) */
  rgpd: string
  /** Label du numéro d'enregistrement à afficher (Cerfa / N° AL / etc.) */
  numeroLabel: string
  /** Note de fin (disclaimer si template non validé juridiquement) */
  disclaimer: string | null
}

type TemplatesByLang = Record<ContractLang, ContractTemplate>

const FR_LAW: TemplatesByLang = {
  fr: {
    legalBasis: 'Établi conformément au Code civil (Art. 1366) et au Code du tourisme (L324-1).',
    sectionBienLoue: 'Bien loué',
    obligationsBailleur:
      "remettre le logement en bon état, assurer la jouissance paisible des lieux, " +
      "et garantir contre les vices et défauts qui rendraient le bien impropre à l'usage.",
    obligationsLocataire:
      "user du logement en bon père de famille, payer le loyer aux termes convenus, " +
      "ne pas sous-louer sans accord écrit du bailleur, respecter la capacité maximale " +
      "d'occupation, et restituer les lieux dans l'état initial.",
    loiApplicable:
      "Le présent contrat est soumis au droit français. En cas de litige, les parties " +
      "tenteront de résoudre leur différend à l'amiable. À défaut, le tribunal compétent " +
      "sera celui du lieu de situation du bien loué.",
    declarationVoyageur:
      "Pour les voyageurs de nationalité étrangère, le bailleur procédera à l'établissement " +
      "d'une fiche individuelle de police (arrêté du 1er octobre 2015) qui sera conservée " +
      "pendant six mois et transmise sur réquisition aux services de police ou de gendarmerie.",
    signatureElectronique:
      "La signature électronique apposée ci-dessous constitue une signature électronique simple " +
      "au sens du règlement (UE) n° 910/2014 (eIDAS) et de l'article 1366 du Code civil français. " +
      "Elle est produite après identification du signataire par son adresse email, et l'enregistrement " +
      "de l'adresse IP, de l'horodatage et du navigateur utilisé (audit trail). Sa valeur probante " +
      "est reconnue devant les juridictions françaises et européennes.",
    rgpd:
      "Les données personnelles collectées dans ce contrat sont traitées sur la base légale de " +
      "l'exécution du contrat (Art. 6.1.b RGPD). Elles sont conservées 5 ans à compter de la fin " +
      "du séjour (prescription civile, Art. 2224 Code civil). Vous disposez d'un droit d'accès, " +
      "de rectification et d'effacement auprès du bailleur.",
    numeroLabel: "Numéro de déclaration en mairie",
    disclaimer: null,
  },
  pt: {
    legalBasis: 'Estabelecido em conformidade com o Código Civil francês (Art. 1366) e o Código do Turismo francês (L324-1).',
    sectionBienLoue: 'Bem arrendado',
    obligationsBailleur:
      "entregar o alojamento em bom estado, assegurar o gozo pacífico do imóvel, " +
      "e garantir contra vícios e defeitos que o tornem impróprio para o uso a que se destina.",
    obligationsLocataire:
      "utilizar o alojamento com o cuidado de um bom pai de família, pagar a renda nos prazos " +
      "acordados, não sublocar sem o acordo escrito do senhorio, respeitar a capacidade máxima " +
      "de ocupação, e devolver o imóvel no estado inicial.",
    loiApplicable:
      "O presente contrato rege-se pelo direito francês. Em caso de litígio, as partes procurarão " +
      "uma resolução amigável. Na falta de acordo, o tribunal competente será o do local onde se " +
      "situa o imóvel arrendado.",
    declarationVoyageur:
      "Para os hóspedes de nacionalidade estrangeira, o senhorio procederá ao preenchimento de uma " +
      "ficha individual de polícia (despacho de 1 de outubro de 2015), conservada durante seis meses " +
      "e transmitida a pedido das autoridades policiais francesas.",
    signatureElectronique:
      "A assinatura eletrónica aposta abaixo constitui uma assinatura eletrónica simples na aceção " +
      "do Regulamento (UE) n.º 910/2014 (eIDAS) e do artigo 1366.º do Código Civil francês. É produzida " +
      "após identificação do signatário através do seu endereço de e-mail, com registo do endereço IP, " +
      "da data/hora e do navegador utilizado (audit trail). O seu valor probatório é reconhecido " +
      "perante os tribunais franceses e europeus.",
    rgpd:
      "Os dados pessoais recolhidos neste contrato são tratados com base na execução do contrato " +
      "(Art. 6.º, n.º 1, alínea b), do RGPD). São conservados durante 5 anos a contar do final da " +
      "estadia (prescrição civil francesa, Art. 2224.º do Código Civil). Tem direito de acesso, " +
      "retificação e apagamento junto do senhorio.",
    numeroLabel: "Número de declaração na Câmara Municipal (mairie)",
    disclaimer: null,
  },
  en: {
    legalBasis: 'Established in accordance with the French Civil Code (Art. 1366) and the French Tourism Code (L324-1).',
    sectionBienLoue: 'Rented property',
    obligationsBailleur:
      "hand over the accommodation in good condition, ensure peaceful enjoyment of the premises, " +
      "and guarantee against defects that would render the property unfit for its intended use.",
    obligationsLocataire:
      "use the accommodation with due care, pay the rent on the agreed terms, not sublet without " +
      "the landlord's written consent, comply with the maximum occupancy, and return the premises " +
      "in their original condition.",
    loiApplicable:
      "This contract is governed by French law. In the event of a dispute, the parties shall attempt " +
      "an amicable resolution. Failing that, the competent court shall be the one where the rented " +
      "property is located.",
    declarationVoyageur:
      "For guests of foreign nationality, the landlord will complete an individual police form " +
      "(order of 1 October 2015), kept for six months and provided to French police or gendarmerie " +
      "upon request.",
    signatureElectronique:
      "The electronic signature affixed below constitutes a simple electronic signature within the " +
      "meaning of Regulation (EU) No 910/2014 (eIDAS) and Article 1366 of the French Civil Code. It is " +
      "produced after identifying the signatory via their email address, with the IP address, timestamp " +
      "and browser used being recorded (audit trail). Its evidentiary value is recognised before French " +
      "and European courts.",
    rgpd:
      "The personal data collected in this contract is processed on the legal basis of contract " +
      "performance (Art. 6.1.b GDPR). It is kept for 5 years from the end of the stay (French civil " +
      "limitation period, Art. 2224 of the Civil Code). You have the right to access, rectify and " +
      "erase your data by contacting the landlord.",
    numeroLabel: "Town hall (mairie) declaration number",
    disclaimer: null,
  },
}

const PT_LAW: TemplatesByLang = {
  fr: {
    legalBasis:
      "Estabelecido em conformidade com o Decreto-Lei n.º 128/2014 (Alojamento Local), " +
      "os artigos 1022.º a 1029.º e 405.º a 406.º do Código Civil português. " +
      "Établi en français par convention entre les parties.",
    sectionBienLoue: "Bien loué (Alojamento Local)",
    obligationsBailleur:
      "remettre le logement en bon état et conforme à son enregistrement AL, " +
      "afficher visiblement la plaque AL avec le numéro à l'entrée, mettre à disposition " +
      "le Livro de Reclamações, et assurer la jouissance paisible des lieux.",
    obligationsLocataire:
      "utiliser le logement avec diligence et respect du voisinage, payer le prix " +
      "convenu aux dates fixées, ne pas sous-louer sans accord écrit du bailleur, " +
      "respecter la capacité maximale d'occupation, restituer les lieux dans l'état initial, " +
      "et coopérer à la déclaration SIBA si requis (voyageurs étrangers).",
    loiApplicable:
      "Le présent contrat est soumis au droit portugais (Decreto-Lei n.º 128/2014 et Código Civil). " +
      "En cas de litige, les parties tenteront une résolution amiable. À défaut, le tribunal " +
      "compétent sera celui du district du logement (foro do lugar do imóvel).",
    declarationVoyageur:
      "Pour TOUS les voyageurs étrangers (UE comprise), le bailleur procédera à la déclaration " +
      "des données du séjour via le portail SIBA (Sistema de Informação de Boletins de Alojamento) " +
      "dans les 3 jours suivant l'arrivée, conformément à la loi n.º 23/2007 et à ses modifications. " +
      "Le locataire s'engage à fournir les informations nécessaires (nationalité, document " +
      "d'identité, date de naissance) à cet effet.",
    signatureElectronique:
      "La signature électronique apposée ci-dessous constitue une signature électronique simple " +
      "au sens du règlement (UE) n° 910/2014 (eIDAS), directement applicable au Portugal. " +
      "Elle est produite après identification du signataire par son adresse email, et l'enregistrement " +
      "de l'adresse IP, de l'horodatage et du navigateur utilisé (audit trail). Sa valeur probante " +
      "est reconnue devant les juridictions portugaises et européennes.",
    rgpd:
      "Les données personnelles collectées dans ce contrat sont traitées sur la base légale de " +
      "l'exécution du contrat (Art. 6.1.b RGPD). Elles sont conservées 5 ans à compter de la fin " +
      "du séjour (prescription civile portugaise, Art. 309.º Código Civil). Vous disposez d'un " +
      "droit d'accès, de rectification et d'effacement auprès du bailleur. CNPD : entité de " +
      "contrôle portugaise (https://www.cnpd.pt).",
    numeroLabel: "Numéro AL (Alojamento Local)",
    disclaimer:
      "⚠️ Ce modèle de contrat Alojamento Local est fourni à titre indicatif et synthétise " +
      "les principales obligations du régime portugais. Pour un usage régulier ou un litige " +
      "à forts enjeux, il est recommandé de faire valider ce contrat par un avocat portugais.",
  },
  pt: {
    legalBasis:
      "Estabelecido em conformidade com o Decreto-Lei n.º 128/2014 (Alojamento Local) e os artigos " +
      "1022.º a 1029.º e 405.º a 406.º do Código Civil português.",
    sectionBienLoue: "Imóvel arrendado (Alojamento Local)",
    obligationsBailleur:
      "entregar o alojamento em bom estado e em conformidade com o respetivo registo AL, afixar " +
      "visivelmente a placa AL com o número à entrada, disponibilizar o Livro de Reclamações, " +
      "e assegurar o gozo pacífico do imóvel.",
    obligationsLocataire:
      "utilizar o alojamento com diligência e respeito pela vizinhança, pagar o preço acordado " +
      "nas datas fixadas, não sublocar sem o acordo escrito do senhorio, respeitar a capacidade " +
      "máxima de ocupação, devolver o imóvel no estado inicial, e cooperar na declaração SIBA " +
      "quando exigido (hóspedes estrangeiros).",
    loiApplicable:
      "O presente contrato rege-se pelo direito português (Decreto-Lei n.º 128/2014 e Código Civil). " +
      "Em caso de litígio, as partes procurarão uma resolução amigável. Na falta de acordo, o " +
      "tribunal competente será o do foro do lugar do imóvel.",
    declarationVoyageur:
      "Para TODOS os hóspedes estrangeiros (incluindo UE), o senhorio procederá à declaração dos " +
      "dados da estadia através do portal SIBA (Sistema de Informação de Boletins de Alojamento) " +
      "no prazo de 3 dias após a chegada, nos termos da Lei n.º 23/2007 e respetivas alterações. " +
      "O hóspede compromete-se a fornecer as informações necessárias (nacionalidade, documento de " +
      "identificação, data de nascimento) para este efeito.",
    signatureElectronique:
      "A assinatura eletrónica aposta abaixo constitui uma assinatura eletrónica simples na aceção " +
      "do Regulamento (UE) n.º 910/2014 (eIDAS), diretamente aplicável em Portugal. É produzida após " +
      "identificação do signatário através do seu endereço de e-mail, com registo do endereço IP, " +
      "da data/hora e do navegador utilizado (audit trail). O seu valor probatório é reconhecido " +
      "perante os tribunais portugueses e europeus.",
    rgpd:
      "Os dados pessoais recolhidos neste contrato são tratados com base na execução do contrato " +
      "(Art. 6.º, n.º 1, alínea b), do RGPD). São conservados durante 5 anos a contar do final da " +
      "estadia (prescrição civil portuguesa, Art. 309.º do Código Civil). Tem direito de acesso, " +
      "retificação e apagamento junto do senhorio. CNPD: entidade de controlo portuguesa " +
      "(https://www.cnpd.pt).",
    numeroLabel: "Número AL (Alojamento Local)",
    disclaimer:
      "⚠️ Este modelo de contrato de Alojamento Local é fornecido a título indicativo e resume " +
      "as principais obrigações do regime português. Para uso regular ou litígios de maior " +
      "relevância, recomenda-se a validação deste contrato por um advogado português.",
  },
  en: {
    legalBasis:
      "Established in accordance with Decree-Law No. 128/2014 (Alojamento Local, Portuguese " +
      "short-term rental regime) and Articles 1022 to 1029 and 405 to 406 of the Portuguese Civil Code.",
    sectionBienLoue: "Rented property (Alojamento Local)",
    obligationsBailleur:
      "hand over the accommodation in good condition and in compliance with its AL registration, " +
      "visibly display the AL plaque with the registration number at the entrance, make the Complaints " +
      "Book (Livro de Reclamações) available, and ensure peaceful enjoyment of the premises.",
    obligationsLocataire:
      "use the accommodation diligently and with respect for the neighbourhood, pay the agreed price " +
      "on the fixed dates, not sublet without the landlord's written consent, comply with the maximum " +
      "occupancy, return the premises in their original condition, and cooperate with the SIBA " +
      "declaration when required (foreign guests).",
    loiApplicable:
      "This contract is governed by Portuguese law (Decree-Law No. 128/2014 and the Civil Code). " +
      "In the event of a dispute, the parties shall attempt an amicable resolution. Failing that, " +
      "the competent court shall be that of the district where the property is located (foro do " +
      "lugar do imóvel).",
    declarationVoyageur:
      "For ALL foreign guests (including EU nationals), the landlord will submit the stay details " +
      "via the SIBA portal (Sistema de Informação de Boletins de Alojamento) within 3 days of arrival, " +
      "in accordance with Law No. 23/2007 and its amendments. The guest agrees to provide the " +
      "necessary information (nationality, ID document, date of birth) for this purpose.",
    signatureElectronique:
      "The electronic signature affixed below constitutes a simple electronic signature within the " +
      "meaning of Regulation (EU) No 910/2014 (eIDAS), directly applicable in Portugal. It is produced " +
      "after identifying the signatory via their email address, with the IP address, timestamp and " +
      "browser used being recorded (audit trail). Its evidentiary value is recognised before " +
      "Portuguese and European courts.",
    rgpd:
      "The personal data collected in this contract is processed on the legal basis of contract " +
      "performance (Art. 6.1.b GDPR). It is kept for 5 years from the end of the stay (Portuguese " +
      "civil limitation period, Art. 309 of the Civil Code). You have the right to access, rectify " +
      "and erase your data by contacting the landlord. CNPD: Portuguese data protection authority " +
      "(https://www.cnpd.pt).",
    numeroLabel: "AL number (Alojamento Local)",
    disclaimer:
      "⚠️ This Alojamento Local contract template is provided for guidance and summarises the main " +
      "obligations under the Portuguese regime. For regular use or high-stakes disputes, it is " +
      "recommended to have this contract validated by a Portuguese lawyer.",
  },
}

export const CONTRACT_TEMPLATES: Partial<Record<CountryCode, TemplatesByLang>> = {
  FR: FR_LAW,
  PT: PT_LAW,

  // ─── Pays en preview (config FR par défaut tant que pas validé) ──
  // Pour ajouter un pays, dupliquer le pattern PT_LAW et sourcer chaque champ,
  // dans les 3 langues (fr/pt/en).
  ES: undefined,
  IT: undefined,
  BE: undefined,
  CH: undefined,
}

/** Retourne le template du pays + langue demandés, ou FR si le pays n'est pas
 *  encore implémenté / la langue n'existe pas pour ce pays. */
export function getContractTemplate(
  country: string | null | undefined,
  lang: string | null | undefined = 'fr'
): ContractTemplate {
  const code = (country ?? 'FR') as CountryCode
  const l: ContractLang = lang === 'pt' || lang === 'en' ? lang : 'fr'
  const byLang = CONTRACT_TEMPLATES[code] ?? FR_LAW
  return byLang[l]
}
