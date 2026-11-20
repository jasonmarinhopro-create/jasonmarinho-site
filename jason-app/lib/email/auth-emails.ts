// E-mails du compte (20/11/2026) : confirmation d'adresse (inscription, renvoi
// depuis la page de connexion) et mot de passe oublié. Contenu pur, testé.
import { buildEmail, emailAnnuairesPromo, emailBtn, emailNote, emailP, escHtml } from './template'

/** Confirmation de l'adresse : premier envoi (`renvoi: false`) ou nouveau lien */
export function confirmationEmail(o: { fullName: string | null; link: string; isInvestor: boolean; renvoi: boolean }): { subject: string; html: string } {
  const prenom = (o.fullName ?? '').trim().split(/\s+/)[0] ?? ''
  const html = buildEmail({
    etiquette: 'Ton compte',
    title: 'Confirme ton adresse e-mail',
    preview: o.renvoi ? 'Voici un nouveau lien pour ouvrir ton espace.' : 'Une dernière étape et ton espace Jason Marinho est à toi.',
    body: [
      emailP(`Bienvenue${prenom ? ` ${escHtml(prenom)}` : ''}&nbsp;!`, 10),
      emailP(o.renvoi
        ? 'Voici un nouveau lien : un clic et tu arrives dans ton espace, déjà connecté.'
        : 'Ton compte est prêt. Un clic sur le bouton confirme ton adresse et t’ouvre ton espace, déjà connecté.'),
      emailBtn(o.link, 'Accéder à mon espace'),
      emailNote('Le lien est valable 24 heures. Si tu n’as pas créé de compte sur Jason Marinho, ignore simplement cet e-mail.'),
      o.isInvestor ? '' : emailAnnuairesPromo(),
    ].join(''),
    signature: o.isInvestor
      ? 'Ravi de te compter parmi nous. Si tu as un projet d’achat en tête, réponds-moi en deux lignes : je te dis par où commencer.'
      : 'Ravi de te compter parmi les hôtes. Dis-moi en répondant à cet e-mail ce qui te prend le plus de temps aujourd’hui : c’est comme ça que je choisis quoi construire.',
  })
  return { subject: 'Confirme ton adresse e-mail', html }
}

/** Mot de passe oublié : sobre, sans signature (e-mail de sécurité) */
export function resetPasswordEmail(link: string): { subject: string; html: string } {
  const html = buildEmail({
    etiquette: 'Sécurité',
    title: 'Choisis un nouveau mot de passe',
    preview: 'Un lien pour choisir un nouveau mot de passe, valable 1 heure.',
    body: [
      emailP('Tu as demandé à réinitialiser le mot de passe de ton compte Jason Marinho.'),
      emailBtn(link, 'Choisir un nouveau mot de passe'),
      emailNote('Le lien est valable 1 heure. Si la demande ne vient pas de toi, ignore cet e-mail : ton mot de passe ne change pas.'),
    ].join(''),
  })
  return { subject: 'Réinitialise ton mot de passe', html }
}
