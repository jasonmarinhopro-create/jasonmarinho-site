/**
 * Gabarit commun des e-mails transactionnels (DA claire de la marque, 29/09/2026).
 * Avant : thème sombre « scandinave » (fond presque noir, texte clair, jaune),
 * peu lisible dans les messageries en mode clair et différent de l'app.
 * Maintenant : fond vert très pâle, carte blanche, vert de la marque #004C3F,
 * touche de jaune. `lightify()` convertit les couleurs de l'ancien thème
 * encore écrites en dur dans certains e-mails (contrats, inscription…).
 */

interface EmailOptions {
  title: string
  body: string          // HTML de la carte (déjà formaté)
  preview?: string      // Texte d'aperçu (caché, affiché par la messagerie)
}

const BG         = '#ECF5EF'
const CARD_BG    = '#FFFFFF'
const BORDER     = '#D5E5DB'
const TEXT       = '#0B1D0F'
const TEXT_MUTED = '#4A5D51'
const ACCENT     = '#004C3F'
const YELLOW     = '#FFD56B'
const SOFT_BG    = '#F4F9F6'
const FONT       = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"

/** Couleurs de l'ancien thème sombre → équivalents lisibles sur fond clair */
const LEGACY_COLORS: Array<[RegExp, string]> = [
  [/#e8ede8|#f0ebe1|#f0f4ff/gi, TEXT],
  [/#7a9e8a|#a5c4b0|#6b9a7e/gi, TEXT_MUTED],
  [/#FFD56B/gi, ACCENT],
  [/#0d1f1a/gi, BG],
  [/#132b22/gi, CARD_BG],
  [/#0a1a13|#0d1a15|#0e1f18|#060d0b|#0a2018/gi, SOFT_BG],
  [/#1a3328|#1e3d2f/gi, BORDER],
  [/#0a0f0d|#061208/gi, '#FFFFFF'],
  [/#63D683|#34D399/gi, '#1F7A4D'],
  [/#F97583/gi, '#C2344A'],
  [/#f59e0b/gi, '#8A5A12'],
  [/#a29bfe|#8b84e8/gi, ACCENT],
  [/rgba\(99,\s*91,\s*255,/gi, 'rgba(0,76,63,'],
  [/rgba\(255,\s*255,\s*255,\s*0\.0[0-9]\)/gi, SOFT_BG],
  [/rgba\(255,\s*255,\s*255,\s*0\.1\d?\)/gi, BORDER],
]

export function lightify(html: string): string {
  return LEGACY_COLORS.reduce((acc, [re, to]) => acc.replace(re, to), html)
}

export function buildEmail({ title, body, preview = '' }: EmailOptions): string {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escHtml(title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BG};-webkit-text-size-adjust:100%;mso-line-height-rule:exactly;">
  ${preview ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escHtml(preview)}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};padding:40px 16px 56px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">

        <!-- Marque -->
        <tr><td style="padding-bottom:24px;" align="center">
          <span style="font-size:19px;color:${TEXT};letter-spacing:-0.3px;font-family:Georgia,'Times New Roman',serif;">
            Jason <em style="color:${ACCENT};font-style:italic;">Marinho</em>
          </span>
        </td></tr>

        <!-- Carte -->
        <tr><td style="background:${CARD_BG};border:1px solid ${BORDER};border-radius:18px;padding:36px 32px 32px;">
          <div style="width:40px;height:4px;border-radius:4px;background:${YELLOW};margin:0 0 20px;"></div>
          <h1 style="margin:0 0 22px;font-size:23px;font-weight:400;color:${TEXT};line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.3px;">
            ${title}
          </h1>
          ${lightify(body)}
        </td></tr>

        <!-- Pied -->
        <tr><td style="padding-top:26px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:${TEXT_MUTED};font-family:${FONT};">
            Jason Marinho &middot; Location courte durée
          </p>
          <p style="margin:0;font-size:12px;font-family:${FONT};">
            <a href="https://app.jasonmarinho.com" style="color:${ACCENT};text-decoration:none;">app.jasonmarinho.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/** Bouton d'action */
export function emailBtn(href: string, label: string, variant: 'primary' | 'secondary' | 'green' = 'primary'): string {
  const styles: Record<string, string> = {
    primary:   `background:${ACCENT};color:#FFFFFF;border:1px solid ${ACCENT};`,
    secondary: `background:#FFFFFF;color:${ACCENT};border:1px solid ${BORDER};`,
    green:     `background:${ACCENT};color:#FFFFFF;border:1px solid ${ACCENT};`,
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:4px 0 20px;">
    <a href="${href}" style="display:inline-block;${styles[variant]}padding:13px 26px;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;font-family:${FONT};letter-spacing:0.1px;">
      ${label}
    </a>
  </td></tr></table>`
}

/** Bloc d'informations (libellé / valeur) */
export function emailInfoBlock(rows: { label: string; value: string }[], accentColor = ACCENT): string {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:6px 0;font-size:12.5px;color:${TEXT_MUTED};font-family:${FONT};white-space:nowrap;padding-right:16px;vertical-align:top;">${escHtml(r.label)}</td>
      <td style="padding:6px 0;font-size:14px;color:${TEXT};font-weight:600;font-family:${FONT};">${r.value}</td>
    </tr>`).join('')
  return `<div style="background:${SOFT_BG};border:1px solid ${BORDER};border-left:3px solid ${accentColor};border-radius:12px;padding:16px 20px;margin:0 0 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
  </div>`
}

/** Note (sécurité, mention légale…) */
export function emailNote(text: string): string {
  return `<div style="background:${SOFT_BG};border:1px solid ${BORDER};border-radius:10px;padding:14px 18px;margin:20px 0 0;">
    <p style="margin:0;font-size:12.5px;color:${TEXT_MUTED};line-height:1.7;font-family:${FONT};">${text}</p>
  </div>`
}

/** Paragraphe */
export function emailP(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#2E3F33;font-family:${FONT};">${text}</p>`
}

/** Échappement HTML simple */
export function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Encart annuaires (photographes + ménage) à glisser dans les e-mails
 * destinés aux HÔTES, jamais dans les e-mails voyageurs.
 */
export function emailAnnuairesPromo(): string {
  const link = (href: string, label: string) =>
    `<a href="${href}" style="color:${ACCENT};font-weight:600;text-decoration:none;">${label}</a>`
  return `<div style="background:${SOFT_BG};border:1px solid ${BORDER};border-radius:12px;padding:16px 20px;margin:24px 0 0;">
    <p style="margin:0 0 8px;font-size:13.5px;font-weight:600;color:${TEXT};font-family:${FONT};">Besoin d&rsquo;un coup de main pour ton logement&nbsp;?</p>
    <p style="margin:0;font-size:13px;color:${TEXT_MUTED};line-height:1.7;font-family:${FONT};">
      ${link('https://jasonmarinho.com/annuaires/photographes', 'Photographes LCD')} : des photos pro pour ton annonce<br>
      ${link('https://jasonmarinho.com/annuaires/menage', 'Équipes de ménage LCD')} : un ménage fiable entre deux voyageurs<br>
      Contact direct, sans commission.
    </p>
  </div>`
}
