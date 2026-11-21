// Aperçu de tous les e-mails (Admin > Prospection > E-mails de la plateforme,
// 20/11/2026, Jason : « voir la beauté des mails sans que ça consomme »).
// Données fictives, rien n'est lu en base ni envoyé : seul l'e-mail affiché
// est calculé (fonctions `render` paresseuses). Même liste que la galerie
// publiée le 20/11/2026. Les e-mails du site statique (bouton Contacter,
// inscription d'un pro) vivent dans scripts/lib/pro-contact-email.cjs, hors de l'app.
import 'server-only'
import { confirmationEmail, resetPasswordEmail } from './auth-emails'
import { contractInviteEmail, contractSignedGuestEmail, contractSignedHostEmail, paymentReminderEmail, depositOpenEmailContent } from './contract-emails'
import { buildDepositGuestEmail } from './deposit-guest-content'
import { paiementReceivedEmail, mentionEmail } from './host'
import { proWelcomeEmail } from './pro-welcome'
import { documentEmail, quoteAcceptedEmail } from './pro-documents'
import { adminTextToHtml } from './admin'
import { buildEmail, emailBtn, emailCitation, emailEtapes, emailInfoBlock, emailP, escHtml } from './template'
import { buildProMonthlyEmail, buildMonthlyRecapEmail, previousMonth } from '@/lib/visibility/pro-monthly'
import { proEmail, hoteEmail, hoteManuelEmail, adminEmail } from '@/lib/demandes/emails'
import { inscriptionEmail } from '@/lib/auth/nouveau-membre'

export interface CatalogueItem { id: string; group: string; to: string; when: string; render: () => { subject: string; html: string } }

let cache: CatalogueItem[] | null = null

export function emailCatalogue(): CatalogueItem[] {
  if (cache) return cache
  const items: CatalogueItem[] = []
  const add = (group: string, id: string, to: string, when: string, render: () => { subject: string; html: string }, _status?: string) => { void _status; items.push({ group, id, to, when, render }) }
  const month = previousMonth('2026-12-01')
  const d = { metier: 'photographe' as const, etablissement: null, ville: 'Annecy', logement: 'T2, 45 m²', quand: 'Avant le 15 décembre', frequence: 'Photos de l’annonce', budget: '200 à 300 €', message: 'Bonjour, je refais mon annonce Airbnb avant les vacances de Noël. Disponible un matin en semaine ?', nom: 'Camille Durand', email: 'camille@exemple.fr', telephone: '06 12 34 56 78' }
  const pros = [{ nom: 'Studio Lumière', ville: 'Annecy', url: 'https://jasonmarinho.com/annuaires/photographes/studio-lumiere' }, { nom: 'Léa Martin Photo', ville: 'Annecy-le-Vieux', url: 'https://jasonmarinho.com' }]
  const payments = { payUrl: 'https://app.jasonmarinho.com/pay', loyer: '640,00', depositUrl: null, caution: '400,00', depositLater: '18 décembre' }
  const vir = { iban: 'FR76 3000 6000 0112 3456 7890 189', bic: 'AGRIFRPP', beneficiaire: 'Sophie Bernard', montant: '640,00', reference: '12 rue des Alpes' }

  // Membres
  add('Hôtes et membres', 'confirmation', 'Nouveau membre', 'À l’inscription', () => confirmationEmail({ fullName: 'Thomas Petit', link: 'https://app.jasonmarinho.com/auth/confirmer', isInvestor: false, renvoi: false }), 'refait')
  add('Hôtes et membres', 'reset', 'Membre', 'Mot de passe oublié', () => resetPasswordEmail('https://app.jasonmarinho.com/reset'), 'refait')
  add('Hôtes et membres', 'compte-admin', 'Membre créé par toi', 'Quand tu crées un compte depuis l’admin', () => ({ subject: 'Ton accès Jason Marinho est prêt', html: buildEmail({ etiquette: 'Ton compte', title: 'Bienvenue, Thomas Petit', signature: true, body: `${emailP('Ton compte vient d’être créé sur la plateforme. Voici tes identifiants de connexion :')}${emailInfoBlock([{ label: 'E-mail', value: 'thomas@exemple.fr' }, { label: 'Mot de passe temporaire', value: '<span style="font-family:Courier New,monospace;">k8Fz-29qa</span>' }])}${emailP('Connecte-toi avec ces identifiants, puis pense à changer ce mot de passe depuis ton profil.')}${emailBtn('https://app.jasonmarinho.com/auth/login', 'Me connecter')}` }) }), 'restylé')
  add('Hôtes et membres', 'driing', 'Membre Driing', 'Quand tu valides son adhésion', () => ({ subject: 'Ton accès Membre Driing est confirmé', html: buildEmail({ etiquette: 'Membre Driing', title: 'Bienvenue, Thomas', signature: 'Merci de faire partie de l’aventure Driing. Si quelque chose bloque dans ton espace, réponds-moi ici.', body: `${emailP('Ton adhésion <strong>Membre Driing</strong> vient d’être confirmée. Tout ce qui est réservé à l’offre Standard est maintenant ouvert dans ton espace :')}${emailEtapes(['Toutes les formations.', 'Les contrats signés en ligne, avec le loyer payé par carte et la caution par empreinte bancaire.'])}${emailBtn('https://app.jasonmarinho.com/dashboard', 'Accéder à mon espace')}` }) }), 'refait')
  add('Hôtes et membres', 'loyer', 'Hôte', 'Loyer payé en ligne par le voyageur', () => paiementReceivedEmail({ hostFirstName: 'Sophie', guestFullName: 'Marc Lefèvre', type: 'loyer', montant: 640, dateArrivee: '2026-12-20', dashboardUrl: 'https://app.jasonmarinho.com/dashboard/voyageurs' }), 'refait')
  add('Hôtes et membres', 'caution-bloquee', 'Hôte', 'Caution bloquée sur la carte du voyageur', () => paiementReceivedEmail({ hostFirstName: 'Sophie', guestFullName: 'Marc Lefèvre', type: 'caution', montant: 400, dateArrivee: '2026-12-20', dashboardUrl: 'https://app.jasonmarinho.com/dashboard/voyageurs' }), 'refait')
  add('Hôtes et membres', 'entre-hotes', 'Hôte', 'Réponse ou mention dans Entre Hôtes', () => mentionEmail({ recipientFirstName: 'Sophie', actorFullName: 'Paul Girard', type: 'reply', postTitle: 'Taxe de séjour : forfait ou au réel ?', postUrl: 'https://app.jasonmarinho.com', excerpt: 'Chez moi la commune est passée au réel l’an dernier, je déclare chaque mois sur la plateforme de la mairie…' }), 'refait')
  add('Hôtes et membres', 'checkin', 'Hôte', 'Le voyageur remplit son check-in en ligne', () => ({ subject: 'Check-in complété : Marc Lefèvre', html: buildEmail({ etiquette: 'Check-in en ligne', title: 'Check-in complété : Marc Lefèvre', body: `${emailP('<strong>Marc Lefèvre</strong> vient de compléter son check-in en ligne.')}${emailInfoBlock([{ label: 'Voyageur principal', value: 'Marc Lefèvre' }, { label: 'Groupe déclaré', value: '2 voyageurs' }, { label: 'Julie Lefèvre', value: 'fiche complète' }])}${emailP('Identité, document et signature sont dans la fiche du voyageur. Les déclarations obligatoires en tiennent compte.')}${emailBtn('https://app.jasonmarinho.com', 'Voir la fiche voyageur')}` }) }), 'restylé')
  add('Hôtes et membres', 'demande-partie', 'Hôte (Trouver un pro)', 'Sa demande part chez les pros', () => hoteEmail(d, { pros, vague: 1, suiviUrl: 'https://jasonmarinho.com/suivi', sansProQui: 'photographe', guideUrl: 'https://jasonmarinho.com', partielNote: null, inscriptionUrl: 'https://jasonmarinho.com' }), 'signature ajoutée')
  add('Hôtes et membres', 'demande-sans-pro', 'Hôte (Trouver un pro)', 'Aucun pro dans sa zone', () => hoteEmail({ ...d, ville: 'Beauzelle' }, { pros: [], vague: 1, suiviUrl: 'https://jasonmarinho.com/suivi', sansProQui: 'photographe', guideUrl: 'https://jasonmarinho.com', partielNote: null, inscriptionUrl: 'https://jasonmarinho.com' }), 'signature ajoutée')
  add('Hôtes et membres', 'demande-manuel', 'Hôte (Trouver un pro)', 'Tu transmets sa demande à un pro', () => hoteManuelEmail(d, pros[0], 'https://jasonmarinho.com/suivi', true), 'signature ajoutée')

  // Voyageurs
  add('Voyageurs (au nom de l’hôte)', 'invite', 'Voyageur', 'L’hôte crée le contrat', () => contractInviteEmail({ lang: 'fr', hostName: 'Sophie Bernard', guestName: 'Marc Lefèvre', property: 'Chalet des Aravis', adresse: '12 rue des Alpes, 74220 La Clusaz', arrivee: '20 décembre 2026', depart: '27 décembre 2026', signUrl: 'https://app.jasonmarinho.com/sign/x', cgv: true }), 'refait')
  add('Voyageurs (au nom de l’hôte)', 'signe-voyageur', 'Voyageur', 'Juste après sa signature', () => contractSignedGuestEmail({ lang: 'fr', hostName: 'Sophie Bernard', guestName: 'Marc Lefèvre', property: 'Chalet des Aravis', signedAt: '20 novembre 2026 à 18:42', ip: '82.64.10.21', contractUrl: 'https://app.jasonmarinho.com/sign/x', payments, virement: null }), 'refait')
  add('Voyageurs (au nom de l’hôte)', 'signe-voyageur-pt', 'Voyageur (portugais)', 'Contrat en portugais, paiement par virement', () => contractSignedGuestEmail({ lang: 'pt', hostName: 'Sophie Bernard', guestName: 'João Silva', property: 'Casa do Porto', signedAt: '20 de novembro de 2026 às 18:42', ip: '82.64.10.21', contractUrl: 'https://app.jasonmarinho.com/sign/x', payments: { payUrl: null, loyer: '640,00', depositUrl: null, caution: null, depositLater: null }, virement: vir }), 'refait')
  add('Voyageurs (au nom de l’hôte)', 'rappel', 'Voyageur', 'L’hôte clique sur « Renvoyer le lien de paiement »', () => paymentReminderEmail({ lang: 'fr', hostName: 'Sophie Bernard', guestName: 'Marc Lefèvre', property: 'Chalet des Aravis', contractUrl: 'https://app.jasonmarinho.com/sign/x', payments, virement: null }), 'refait')
  add('Voyageurs (au nom de l’hôte)', 'caution-j2', 'Voyageur', 'Automatique, 2 jours avant l’arrivée', () => depositOpenEmailContent({ lang: 'fr', hostName: 'Sophie Bernard', guestName: 'Marc Lefèvre', property: 'Chalet des Aravis', arrival: 'samedi 20 décembre', caution: '400,00', depositUrl: 'https://app.jasonmarinho.com/dep', contractUrl: 'https://app.jasonmarinho.com/sign/x' }), 'refait')
  const dg = buildDepositGuestEmail({ to: 'x', langue: 'fr', token: 't', guestFirstName: 'Marc', hostName: 'Sophie Bernard', property: 'Chalet des Aravis', deposit: 400, outcome: 'released' }, 'https://app.jasonmarinho.com')
  add('Voyageurs (au nom de l’hôte)', 'caution-liberee', 'Voyageur', 'L’hôte libère (ou encaisse) la caution', () => dg, 'restylé')

  // Contrat côté hôte
  add('Hôtes et membres', 'signe-hote', 'Hôte', 'Son voyageur a signé', () => contractSignedHostEmail({ hostFirstName: 'Sophie', guestName: 'João Silva', property: 'Casa do Porto', signedAt: '20 novembre 2026 à 18:42', ip: '82.64.10.21', loyer: '640,00', caution: '400,00', paiementEnLigne: true, declaration: { label: 'SIBA (Portugal)', deadline: 'vendredi 26 décembre', note: 'Tout voyageur étranger doit être déclaré au SEF dans les 3 jours suivant son arrivée.', portalUrl: 'https://siba.ssi.gov.pt' }, contractUrl: 'https://app.jasonmarinho.com/sign/x', dashboardUrl: 'https://app.jasonmarinho.com/dashboard/voyageurs' }), 'refait')

  // Pros
  add('Pros de l’annuaire', 'bilan', 'Pro payant', 'Le 1er du mois (rattrapage jusqu’au 7)', () => buildProMonthlyEmail({ metier: 'photographe', firstName: 'Clara', month, visitors: 137, views: 210, demandes: 3, googleImpressions: 668, best: { query: 'photographe airbnb annecy', place: 6 }, advice: { title: 'Presque en première page', text: 'Tu es 12e sur « photographe gîte haute-savoie » : deux ou trois photos de plus avec ce mot dans la légende peuvent suffire.' }, statsUrl: 'https://app.jasonmarinho.com/dashboard/ma-fiche-photographe/statistiques', publicUrl: 'https://jasonmarinho.com/annuaires/photographes/clara', pct: { visitors: 28, views: 14, demandes: 50, google: -6 }, clicks: 9, city: { label: 'Photographes à Annecy', visitors: 84, toFiche: 21 } }), 'refait')
  add('Pros de l’annuaire', 'bilan-debut', 'Pro payant (fiche toute neuve)', 'Le 1er du mois, fiche sans visite', () => buildProMonthlyEmail({ metier: 'menage', firstName: 'Nadia', month, visitors: 0, views: 0, demandes: 0, googleImpressions: null, best: null, advice: null, statsUrl: 'https://app.jasonmarinho.com', publicUrl: 'https://jasonmarinho.com/annuaires/menage/net-clair' }), 'refait')
  add('Pros de l’annuaire', 'bienvenue-pro', 'Nouveau pro', 'Paiement Stripe confirmé, fiche en ligne', () => proWelcomeEmail({ pro: 'photographer', email: 'clara@exemple.fr', fullName: 'Clara Morel', displayName: 'Clara Morel', ville: 'Annecy', slug: 'clara', tier: 'fondateur' }), 'refait')
  add('Pros de l’annuaire', 'demande-pro', 'Pro', 'Un hôte décrit son besoin (Trouver un pro)', () => proEmail(d, { proPrenom: 'Clara', manuel: false, adequation: null, filtre: false, demandesUrl: 'https://app.jasonmarinho.com', priseUrl: 'https://jasonmarinho.com/demande/prise/x' }), 'même style')
  add('Pros de l’annuaire', 'devis', 'Client du pro', 'Le pro envoie un devis', () => documentEmail({ doc: { number: 'D-2026-014', total_ttc: 280, valid_until: '2026-12-31', client_name: 'Camille', notes: 'Shooting de 2 h, 25 photos retouchées livrées sous 5 jours.', public_token: 't' }, sellerName: 'Studio Lumière' }), 'restylé')
  add('Pros de l’annuaire', 'devis-accepte', 'Pro', 'Son client accepte le devis', () => ({ subject: 'Devis D-2026-014 accepté par Camille', html: quoteAcceptedEmail({ number: 'D-2026-014', client_name: 'Camille Durand', total_ttc: 280, accepted_name: 'Camille Durand' }, 'https://app.jasonmarinho.com') }), 'restylé')

  // Jason
  const lines = [
    { nom: 'Studio Lumière', metier: 'photographe' as const, visitors: 137, demandes: 3, sent: true },
    { nom: 'Net & Clair Ménage', metier: 'menage' as const, visitors: 64, demandes: 1, sent: true },
    { nom: 'Léa Martin Photo', metier: 'photographe' as const, visitors: 22, demandes: 0, sent: true },
    { nom: 'Atelier Images', metier: 'photographe' as const, visitors: 0, demandes: 0, sent: true },
  ]
  add('Pour toi', 'recap-bilans', 'Toi', 'Après l’envoi des bilans des pros', () => buildMonthlyRecapEmail({ month, lines, served: 4, total: 4, failed: 0, lastDay: false, adminUrl: 'https://app.jasonmarinho.com/dashboard/admin/qg' }), 'nouveau')
  add('Pour toi', 'inscription', 'Toi', 'Chaque nouvelle inscription d’hôte', () => inscriptionEmail({ email: 'thomas@exemple.fr', fullName: 'Thomas Petit', isInvestor: false, isDriingMember: false, acquisition: null, via: 'formulaire' }, { mois: 23, total: 412 }), 'compteurs ajoutés')
  add('Pour toi', 'demande-admin', 'Toi', 'Chaque demande Trouver un pro', () => ({ subject: 'Demande d’hôte : photographe à Annecy (2 pros)', html: adminEmail(d, { etiquette: 'Nouvelle demande · Photo & vidéo', title: 'Un hôte cherche un photographe à Annecy', texte: 'Envoyée aux 2 pros les plus proches. Relance automatique sous 48 h sans réponse.', pros: ['Studio Lumière', 'Léa Martin Photo'], qgUrl: 'https://app.jasonmarinho.com' }) }), 'même style')
  add('Pour toi', 'alerte-texte', 'Toi', 'Alertes simples (question sans réponse, demande fermée…)', () => ({ subject: '2 questions sans réponse', html: adminTextToHtml('2 questions sans réponse', 'Ces questions d’Entre Hôtes attendent une réponse depuis plus de 24 h :\n\n« Assurance PNO obligatoire ? » (il reste 20 h)\n« Quel prix pour Noël à Annecy ? » (il reste 6 h)\n\nhttps://app.jasonmarinho.com/dashboard/chez-nous') }), 'avant : texte brut')
  add('Pour toi', 'feedback', 'Toi', 'Retour, idée ou suggestion d’un membre', () => ({ subject: 'Feedback, Idée soumise', html: buildEmail({ etiquette: 'Pour toi · Retour d’un membre', title: 'Idée soumise', body: `${emailCitation('Ce serait top de pouvoir exporter le planning ménage en PDF pour mon équipe.')}${emailInfoBlock([{ label: 'Envoyé par', value: escHtml('sophie@exemple.fr') }])}`, footer: 'Réponds à cet e-mail : ta réponse arrive chez le membre.' }) }), 'restylé')


  cache = items
  return items
}

/**
 * Ordre du parcours (21/11/2026, Jason : « du premier jusqu'au dernier ») :
 * par public, les e-mails dans l'ordre où une personne les reçoit, regroupés
 * par étape. Tout e-mail du catalogue doit y figurer (catalogue.test.ts).
 */
export const PARCOURS: Array<{ public: 'hote' | 'voyageur' | 'pro' | 'toi'; label: string; etapes: Array<{ etape: string; ids: string[] }> }> = [
  {
    public: 'hote', label: 'Hôte', etapes: [
      { etape: 'Arrivée', ids: ['confirmation', 'compte-admin', 'driing'] },
      { etape: 'Trouver un pro', ids: ['demande-partie', 'demande-sans-pro', 'demande-manuel'] },
      { etape: 'Réservation en direct', ids: ['signe-hote', 'loyer', 'caution-bloquee', 'checkin'] },
      { etape: 'Au fil du temps', ids: ['entre-hotes', 'reset'] },
    ],
  },
  {
    public: 'voyageur', label: 'Voyageur', etapes: [
      { etape: 'Avant le séjour', ids: ['invite', 'signe-voyageur', 'signe-voyageur-pt', 'rappel'] },
      { etape: 'Autour du séjour', ids: ['caution-j2', 'caution-liberee'] },
    ],
  },
  {
    public: 'pro', label: 'Pro', etapes: [
      { etape: 'Arrivée', ids: ['bienvenue-pro'] },
      { etape: 'Une mission', ids: ['demande-pro', 'devis', 'devis-accepte'] },
      { etape: 'Chaque mois', ids: ['bilan-debut', 'bilan'] },
    ],
  },
  {
    public: 'toi', label: 'Toi', etapes: [
      { etape: 'Au quotidien', ids: ['inscription', 'demande-admin', 'feedback', 'alerte-texte'] },
      { etape: 'Chaque mois', ids: ['recap-bilans'] },
    ],
  },
]
