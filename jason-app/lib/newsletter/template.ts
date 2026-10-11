// Maquette de la lettre mensuelle « Le Check-in » (11/10/2026, demande de
// Jason : « moderniser, rendre unique, riche en ressources, pas une newsletter à
// l'ancienne »). Pur et testé via build.test.ts.
//
// Choix tirés des tendances 2026 (sources dans CLAUDE.md, « Lettre des hôtes ») :
// en-tête fort avec la une en grand titre (typographie contrastée en texte réel,
// pas en image), « En 30 secondes » en tête (résumé façon TLDR) et temps de
// lecture, blocs de couleur pour séparer les rubriques (cartes, pas de
// colonnes serrées), rubriques fixes qu'on retrouve chaque mois (chiffre du
// mois, agenda, outil du mois, bon plan partenaire, question du mois),
// boutons « bulletproof » (cellule colorée, lisibles sous Outlook), mode sombre
// (color-scheme + styles dédiés, pas de blanc ni de noir purs), une seule
// colonne lisible au téléphone, texte en 16 px, aucune image (rien à bloquer,
// rien à inverser), bien sous les 102 Ko où Gmail coupe un e-mail.

export const NEWSLETTER_NAME = 'Le Check-in'

export interface IssueStory { category: string; title: string; summary: string; url: string; source: string | null }
export interface IssueData {
  campaign: string
  issueNumber: number | null
  mois: string
  subject: string
  preheader: string
  readMinutes: number
  lead: IssueStory
  tldr: string[]
  figure: { value: string; caption: string } | null
  more: IssueStory[]
  agenda: Array<{ date: string; title: string }>
  tool: { name: string; desc: string; url: string; cta: string }
  partner: { name: string; offer: string; desc: string; url: string }
  articles: Array<{ category: string; title: string; desc: string; url: string }>
  changes: Array<{ title: string; desc: string }>
  question: string
}

// ── Rubriques fixes, en rotation d'un mois sur l'autre ──

/** Outil du mois : pages publiques du site (lisibles sans compte) */
export const TOOLS: IssueData['tool'][] = [
  { name: 'Simulateur de taxe de séjour', desc: 'Ce que tu dois collecter par nuit et par voyageur, selon ton classement et ta commune, plafonds 2026 compris.', url: 'https://jasonmarinho.com/services/simulateurs/taxe-de-sejour', cta: 'Faire le calcul' },
  { name: 'Calculateur de prix', desc: 'Un prix par nuit de départ selon ta ville, la saison et la plateforme, commission Airbnb comprise.', url: 'https://jasonmarinho.com/calculateurs/prix-lcd', cta: 'Calculer mon prix' },
  { name: 'Planning ménage automatique', desc: 'Tes ménages calculés depuis Airbnb, Booking et tes réservations directes, avec un lien agenda pour ton équipe.', url: 'https://jasonmarinho.com/services/planning-menage', cta: 'Voir comment ça marche' },
  { name: 'Contrats signés en ligne', desc: 'Pour tes réservations directes : contrat en français, anglais ou portugais, loyer payé en ligne, caution par empreinte.', url: 'https://jasonmarinho.com/services/contrats', cta: 'Découvrir les contrats' },
  { name: 'Simulateur micro-BIC', desc: 'Micro-BIC ou réel : ce que tu paies vraiment avec les plafonds et abattements 2026.', url: 'https://jasonmarinho.com/services/simulateurs/fiscalite-micro-bic', cta: 'Simuler mon impôt' },
  { name: 'Sécurité voyageur', desc: 'Vérifie un voyageur avant d\'accepter sa réservation, grâce aux signalements des autres hôtes.', url: 'https://jasonmarinho.com/services/securite', cta: 'Vérifier un voyageur' },
  { name: 'Simulateur de rentabilité', desc: 'Avant d\'acheter : revenus, charges, crédit et cash-flow mois par mois.', url: 'https://jasonmarinho.com/services/simulateurs/rentabilite-location-courte-duree', cta: 'Lancer la simulation' },
  { name: 'Déclarations voyageurs', desc: 'Fiche de police en France, SIBA au Portugal : préparées à partir de tes réservations.', url: 'https://jasonmarinho.com/services/declarations-voyageurs', cta: 'Voir les déclarations' },
  { name: 'Modèles de messages', desc: 'Les messages à envoyer avant, pendant et après le séjour, prêts à copier.', url: 'https://jasonmarinho.com/services/gabarits-messages', cta: 'Voir les modèles' },
  { name: 'Audit de ta fiche Google', desc: 'Un score et un plan d\'action pour être trouvé quand on cherche « gîte » et ta ville.', url: 'https://jasonmarinho.com/services/audit-gbp', cta: 'Auditer ma fiche' },
  { name: 'Simulateur franchise de TVA', desc: 'Petit-déjeuner, linge, ménage : à partir de quand la TVA s\'applique à ta location.', url: 'https://jasonmarinho.com/services/simulateurs/franchise-tva-lcd', cta: 'Vérifier mon seuil' },
  { name: 'QR codes et affiches', desc: 'Wi-Fi, livret d\'accueil, avis : des affiches prêtes à imprimer pour ton logement.', url: 'https://jasonmarinho.com/services/qr-affiches', cta: 'Créer mes affiches' },
]

/** Bon plan partenaire : vers nos pages partenaires (offre, limites, mention de la commission) */
export const PARTNER_OFFERS: IssueData['partner'][] = [
  { name: 'Lodgify', offer: '-15 % avec le code JASON15', desc: 'Ton site de réservation directe, relié à Airbnb et Booking. Sur Professional et Ultimate, en paiement annuel.', url: 'https://jasonmarinho.com/partenaires/lodgify' },
  { name: 'Indy', offer: 'Premier mois offert', desc: 'Ta compta LMNP, ta liasse 2031 et la facture électronique, sans engagement.', url: 'https://jasonmarinho.com/partenaires/indy' },
  { name: 'AirDNA', offer: 'Données gratuites', desc: 'Occupation, prix moyen et revenus de ta ville avant d\'acheter ou de fixer tes prix.', url: 'https://jasonmarinho.com/partenaires/airdna' },
  { name: 'Shine', offer: 'Compte pro dès 0 €', desc: 'Sépare tes revenus de location, et Shine Facture pour tes devis et factures.', url: 'https://jasonmarinho.com/partenaires/shine' },
  { name: 'Brevo', offer: '300 e-mails par jour gratuits', desc: 'La newsletter pour faire revenir tes voyageurs venus en direct.', url: 'https://jasonmarinho.com/partenaires/brevo' },
  { name: 'Hospitable', offer: '-25 % pendant 3 mois', desc: 'Messages automatiques et codes de serrure à chaque réservation, 14 jours d\'essai.', url: 'https://jasonmarinho.com/hospitable-avis' },
  { name: 'LegalPlace', offer: 'Ta conciergerie créée en ligne', desc: 'Micro-entreprise ou société, statuts et domiciliation, sans te déplacer.', url: 'https://jasonmarinho.com/partenaires/legalplace' },
]

/** Question du mois : réponse par simple retour d'e-mail (les réponses aident la délivrabilité) */
export const QUESTIONS = [
  'Quel est l\'outil sans lequel tu ne pourrais plus gérer ta location ?',
  'As-tu déjà eu une réservation directe ? Comment le voyageur t\'a-t-il trouvé ?',
  'Quelle est ta plus grosse galère avec le ménage ?',
  'Ta basse saison, tu la remplis comment ?',
  'Qu\'est-ce qui te prend le plus de temps chaque semaine ?',
  'Quel sujet veux-tu que je creuse le mois prochain ?',
  'As-tu déjà eu un litige avec un voyageur ? Comment l\'as-tu réglé ?',
  'Comment as-tu fixé ton prix par nuit ?',
  'Micro-BIC ou réel : qu\'as-tu choisi, et pourquoi ?',
  'Quelle question de voyageur revient tout le temps ?',
  'Qu\'est-ce qui a le plus amélioré tes avis ?',
  'Quelle fonction aimerais-tu voir dans l\'app ?',
]

/** Rubrique du mois (0 à 11) d'après le mois de l'envoi */
export const monthIndex = (parisDate: string) => Number(parisDate.slice(5, 7)) - 1

// ── Rendu ──

/** Nos propres domaines : « Lire la suite » plutôt que « Source : jasonmarinho.com » */
const OWN = /(^|\.)jasonmarinho\.com$/

/** « Le Check-in » : dernier mot en italique jaune, comme le logo du site */
function wordmark(): string {
  const words = NEWSLETTER_NAME.split(' ')
  const last = words.pop() ?? ''
  return `${esc(words.join(' '))} <span style="font-style:italic;color:#FFD56B;">${esc(last)}</span>`
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const C = {
  page: '#EDF3EF', card: '#FBFCFA', band: '#0B3B33', bandSoft: '#CFE3D8', yellow: '#FFD56B',
  text: '#18241F', soft: '#46574F', muted: '#66766E', green: '#00664F', amber: '#9A6414',
  mint: '#E3F1EA', cream: '#FFF6DC', rule: '#DCE7E0',
}
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
const SERIF = "Georgia,'Times New Roman',serif"

function button(href: string, label: string, kind: 'yellow' | 'green' = 'green'): string {
  const bg = kind === 'yellow' ? C.yellow : C.band
  const fg = kind === 'yellow' ? C.band : '#FBFCFA'
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td bgcolor="${bg}" style="border-radius:999px;background:${bg};"><a href="${esc(href)}" class="btn-${kind}" style="display:inline-block;padding:12px 22px;font-family:${SANS};font-size:15px;font-weight:700;line-height:1;color:${fg};text-decoration:none;border-radius:999px;">${esc(label)} &rarr;</a></td></tr></table>`
}

const eyebrow = (label: string, color = C.amber) =>
  `<p class="t-amber" style="margin:0 0 10px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${color};">${esc(label)}</p>`

const sectionTitle = (title: string) =>
  `<h2 class="t-main" style="margin:0 0 16px;font-family:${SERIF};font-weight:normal;font-size:24px;line-height:1.25;color:${C.text};">${esc(title)}</h2>`

const pill = (label: string) =>
  `<span class="pill" style="display:inline-block;padding:4px 10px;border-radius:999px;background:${C.mint};color:${C.green};font-family:${SANS};font-size:12px;font-weight:700;">${esc(label)}</span>`

const link = (href: string, label: string) =>
  `<a href="${esc(href)}" class="lnk" style="font-family:${SANS};font-size:15px;font-weight:700;color:${C.green};text-decoration:none;">${esc(label)} &rarr;</a>`

/** Bloc à fond blanc cassé, coins arrondis, marges latérales du gabarit */
const block = (inner: string, opts: { bg?: string; cls?: string; pad?: string } = {}) => `
<tr><td class="px" style="padding:0 24px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
    <tr><td class="${opts.cls ?? 'card'}" bgcolor="${opts.bg ?? C.card}" style="background:${opts.bg ?? C.card};border-radius:18px;padding:${opts.pad ?? '26px 28px'};">${inner}</td></tr>
  </table>
</td></tr>`

const p = (html: string, extra = '') =>
  `<p class="t-soft" style="margin:0 0 14px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.soft};${extra}">${html}</p>`

export function renderIssue(d: IssueData): string {
  const n = d.issueNumber ? `N°&nbsp;${d.issueNumber} · ` : ''

  // En-tête : nom de la lettre, numéro, puis la une en grand
  const header = `
<tr><td class="px" style="padding:0 24px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
    <tr><td class="band" bgcolor="${C.band}" style="background:${C.band};border-radius:22px;padding:30px 30px 34px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="font-family:${SERIF};font-size:22px;color:#FBFCFA;">${wordmark()}</td>
        <td align="right" style="font-family:${SANS};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${C.bandSoft};">${n}${esc(d.mois)}</td>
      </tr></table>
      <p style="margin:6px 0 26px;font-family:${SANS};font-size:13px;color:${C.bandSoft};">La lettre des hôtes, par Jason Marinho</p>
      <p style="margin:0 0 12px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${C.yellow};">À la une · ${esc(d.lead.category)}</p>
      <h1 class="h1" style="margin:0 0 14px;font-family:${SERIF};font-weight:normal;font-size:34px;line-height:1.15;color:#FBFCFA;">${esc(d.lead.title)}</h1>
      <p style="margin:0 0 22px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.bandSoft};">${esc(d.lead.summary)}</p>
      ${button(d.lead.url, d.lead.source && !OWN.test(d.lead.source) ? `Lire sur ${d.lead.source}` : 'Lire la suite', 'yellow')}
    </td></tr>
  </table>
</td></tr>`

  // En 30 secondes
  const tldr = block(`
    ${eyebrow(`En 30 secondes · lecture ${d.readMinutes} min`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${d.tldr.map(t => `<tr><td valign="top" style="width:22px;padding:2px 0 10px;font-family:${SANS};font-size:16px;font-weight:700;color:${C.amber};">&bull;</td><td class="t-main" style="padding:0 0 10px;font-family:${SANS};font-size:16px;line-height:1.5;color:${C.text};">${esc(t)}</td></tr>`).join('')}
    </table>`, { bg: C.cream, cls: 'tint-cream' })

  // Le chiffre du mois
  const figure = d.figure ? block(`
    ${eyebrow('Le chiffre du mois', C.green)}
    <p class="fig" style="margin:0 0 6px;font-family:${SERIF};font-size:56px;line-height:1;color:${C.band};">${esc(d.figure.value)}</p>
    <p class="t-soft" style="margin:0;font-family:${SANS};font-size:15px;line-height:1.55;color:${C.soft};">${esc(d.figure.caption)}</p>`, { bg: C.mint, cls: 'tint-mint' }) : ''

  // Ce qui change aussi
  const more = d.more.length ? block(`
    ${eyebrow('Ce qui change aussi')}
    ${sectionTitle('Les autres nouvelles du mois')}
    ${d.more.map((s, i) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${i ? ` class="rule" style="border-top:1px solid ${C.rule};"` : ''}><tr><td style="padding:${i ? '20px' : '4px'} 0 4px;">
      ${pill(s.category)}
      <h3 class="t-main" style="margin:12px 0 8px;font-family:${SERIF};font-weight:normal;font-size:20px;line-height:1.3;color:${C.text};">${esc(s.title)}</h3>
      ${p(esc(s.summary), 'margin-bottom:10px;')}
      <p style="margin:0 0 14px;">${link(s.url, s.source && !OWN.test(s.source) ? `Source : ${s.source}` : 'Lire la suite')}</p>
    </td></tr></table>`).join('')}`) : ''

  // À l'agenda
  const agenda = d.agenda.length ? block(`
    ${eyebrow('À l\'agenda')}
    ${sectionTitle('Les dates à ne pas rater')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${d.agenda.map(a => `<tr><td valign="top" style="width:88px;padding:0 14px 14px 0;"><span class="pill-date" style="display:inline-block;padding:7px 10px;border-radius:10px;background:${C.cream};color:${C.amber};font-family:${SANS};font-size:13px;font-weight:700;white-space:nowrap;">${esc(a.date)}</span></td><td class="t-main" style="padding:4px 0 14px;font-family:${SANS};font-size:16px;line-height:1.45;color:${C.text};">${esc(a.title)}</td></tr>`).join('')}
    </table>`) : ''

  // Outil du mois + bon plan partenaire, côte à côte sur ordinateur
  const duo = `
<tr><td class="px" style="padding:0 24px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr>
    <td class="col card" width="50%" valign="top" bgcolor="${C.card}" style="background:${C.card};border-radius:18px;padding:24px 22px;">
      ${eyebrow('L\'outil du mois', C.green)}
      <h3 class="t-main" style="margin:0 0 8px;font-family:${SERIF};font-weight:normal;font-size:20px;line-height:1.3;color:${C.text};">${esc(d.tool.name)}</h3>
      <p class="t-soft" style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.55;color:${C.soft};">${esc(d.tool.desc)}</p>
      ${link(d.tool.url, d.tool.cta)}
    </td>
    <td class="col-gap" width="16" style="width:16px;font-size:0;line-height:0;">&nbsp;</td>
    <td class="col tint-cream" width="50%" valign="top" bgcolor="${C.cream}" style="background:${C.cream};border-radius:18px;padding:24px 22px;">
      ${eyebrow('Le bon plan partenaire')}
      <h3 class="t-main" style="margin:0 0 4px;font-family:${SERIF};font-weight:normal;font-size:20px;line-height:1.3;color:${C.text};">${esc(d.partner.name)}</h3>
      <p class="t-main" style="margin:0 0 8px;font-family:${SANS};font-size:15px;font-weight:700;color:${C.band};">${esc(d.partner.offer)}</p>
      <p class="t-soft" style="margin:0 0 16px;font-family:${SANS};font-size:15px;line-height:1.55;color:${C.soft};">${esc(d.partner.desc)}</p>
      ${link(d.partner.url, 'Voir l\'offre')}
      <p class="t-muted" style="margin:12px 0 0;font-family:${SANS};font-size:12px;line-height:1.45;color:${C.muted};">Partenaire : je touche une commission si tu souscris, sans surcoût pour toi.</p>
    </td>
  </tr></table>
</td></tr>`

  // À lire sur le blog
  const articles = d.articles.length ? block(`
    ${eyebrow('À lire sur le blog')}
    ${sectionTitle(d.articles.length > 1 ? 'Les nouveaux guides du mois' : 'Le nouveau guide du mois')}
    ${d.articles.map((a, i) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${i ? ` class="rule" style="border-top:1px solid ${C.rule};"` : ''}><tr><td style="padding:${i ? '18px' : '0'} 0 4px;">
      <p class="t-muted" style="margin:0 0 6px;font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:${C.muted};">${esc(a.category)}</p>
      <h3 class="t-main" style="margin:0 0 6px;font-family:${SERIF};font-weight:normal;font-size:19px;line-height:1.3;color:${C.text};">${esc(a.title)}</h3>
      ${p(esc(a.desc), 'font-size:15px;margin-bottom:8px;')}
      <p style="margin:0 0 14px;">${link(a.url, 'Lire l\'article')}</p>
    </td></tr></table>`).join('')}`) : ''

  // Nouveau dans l'app
  const changes = d.changes.length ? block(`
    ${eyebrow('Nouveau dans l\'app', C.green)}
    ${sectionTitle('Ce qui a changé pour toi')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${d.changes.map(c => `<tr><td valign="top" style="width:30px;padding:2px 0 14px;"><span class="check" style="display:inline-block;width:20px;height:20px;border-radius:999px;background:${C.mint};color:${C.green};font-family:${SANS};font-size:13px;font-weight:700;line-height:20px;text-align:center;">&#10003;</span></td><td style="padding:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.55;"><strong class="t-main" style="color:${C.text};">${esc(c.title)}</strong><br><span class="t-soft" style="color:${C.soft};">${esc(c.desc)}</span></td></tr>`).join('')}
    </table>
    ${button(withUtm('https://app.jasonmarinho.com/dashboard', d.campaign), 'Ouvrir l\'app')}`) : ''

  // Question du mois + signature
  const question = block(`
    ${eyebrow('La question du mois')}
    <p class="t-main" style="margin:0 0 14px;font-family:${SERIF};font-size:22px;line-height:1.35;color:${C.text};">${esc(d.question)}</p>
    ${p('Réponds simplement à cet e-mail, en une ligne si tu veux. Je lis toutes les réponses, et les meilleures idées deviennent les sujets du mois suivant.', 'margin-bottom:22px;')}
    <p class="t-main" style="margin:0;font-family:${SANS};font-size:16px;line-height:1.5;color:${C.text};">À très vite,<br><span class="sig" style="font-family:${SERIF};font-size:20px;font-style:italic;color:${C.band};">Jason</span></p>
    <p class="t-muted" style="margin:16px 0 0;font-family:${SANS};font-size:14px;line-height:1.55;color:${C.muted};">P.S. Un hôte autour de toi gagnerait à lire ça ? Transfère-lui cette lettre : il peut s'inscrire en bas de <a href="${esc(withUtm('https://jasonmarinho.com/blog', d.campaign))}" class="lnk" style="color:${C.green};">la page du blog</a>.</p>`)

  const site = (path: string) => esc(withUtm(`https://jasonmarinho.com${path}`, d.campaign))
  const footer = `
<tr><td class="px" style="padding:8px 24px 36px;text-align:center;font-family:${SANS};">
  <p style="margin:0 0 12px;font-size:13px;line-height:1.6;">
    <a href="${site('/blog')}" class="t-muted" style="color:${C.muted};text-decoration:none;font-weight:700;">Blog</a> &nbsp;·&nbsp;
    <a href="${site('/services/simulateurs')}" class="t-muted" style="color:${C.muted};text-decoration:none;font-weight:700;">Simulateurs</a> &nbsp;·&nbsp;
    <a href="${site('/annuaires/photographes')}" class="t-muted" style="color:${C.muted};text-decoration:none;font-weight:700;">Annuaire des pros</a> &nbsp;·&nbsp;
    <a href="${esc(withUtm('https://app.jasonmarinho.com/dashboard', d.campaign))}" class="t-muted" style="color:${C.muted};text-decoration:none;font-weight:700;">L'app</a>
  </p>
  <p class="t-muted" style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${C.muted};">Tu reçois ${esc(NEWSLETTER_NAME)} parce que tu t'es inscrit à la lettre des hôtes sur jasonmarinho.com ou dans l'app.<br>Jason Marinho · 75015 Paris · <a href="mailto:contact@jasonmarinho.com" class="t-muted" style="color:${C.muted};">contact@jasonmarinho.com</a></p>
  <p style="margin:0;font-size:12px;line-height:1.6;"><a href="{{ mirror }}" class="t-muted" style="color:${C.muted};">Lire dans le navigateur</a> &nbsp;·&nbsp; <a href="{{ unsubscribe }}" class="t-muted" style="color:${C.muted};">Se désinscrire en un clic</a></p>
</td></tr>`

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(d.subject)}</title>
<style>
:root { color-scheme: light dark; supported-color-schemes: light dark; }
body { margin:0; padding:0; -webkit-text-size-adjust:100%; }
a { text-decoration: none; }
@media screen and (max-width: 620px) {
  .px { padding-left: 12px !important; padding-right: 12px !important; }
  .band { padding: 24px 22px 28px !important; }
  .card, .tint-cream, .tint-mint { padding: 22px 20px !important; }
  .h1 { font-size: 28px !important; }
  .fig { font-size: 46px !important; }
  .col { display: block !important; width: 100% !important; box-sizing: border-box; }
  .col-gap { display: block !important; width: 100% !important; height: 16px !important; }
}
@media (prefers-color-scheme: dark) {
  .bg-page { background: #0E1613 !important; }
  .card { background: #16211D !important; }
  .tint-cream { background: #2A2416 !important; }
  .tint-mint, .pill, .check { background: #1B2E26 !important; }
  .t-main { color: #EAF1EC !important; }
  .t-soft { color: #B9C8BF !important; }
  .t-muted { color: #93A49A !important; }
  .t-amber { color: #F2C66B !important; }
  .fig { color: #8FD3A8 !important; }
  .lnk, .pill, .check { color: #8FD3A8 !important; }
  .rule { border-color: #2A3833 !important; }
  .band { background: #0F4A3F !important; }
  .pill-date { background: #2A2416 !important; color: #F2C66B !important; }
  .sig { color: #F2C66B !important; }
}
</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(d.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-page" bgcolor="${C.page}" style="background:${C.page};">
<tr><td align="center" style="padding:16px 0 0;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:640px;">
<tr><td class="px" align="right" style="padding:0 30px 12px;font-family:${SANS};font-size:12px;"><a href="{{ mirror }}" class="t-muted" style="color:${C.muted};">Lire en ligne</a></td></tr>
${header}
${tldr}
${figure}
${more}
${agenda}
${duo}
${articles}
${changes}
${question}
${footer}
</table>
</td></tr>
</table>
</body>
</html>`
}

/** utm de la lettre, seulement sur nos domaines (carte E-mails de Provenance) */
export function withUtm(url: string, campaign: string): string {
  try {
    const u = new URL(url)
    if (!/(^|\.)jasonmarinho\.com$/.test(u.hostname)) return url
    u.searchParams.set('utm_source', 'newsletter')
    u.searchParams.set('utm_medium', 'email')
    u.searchParams.set('utm_campaign', campaign)
    return u.toString()
  } catch { return url }
}
