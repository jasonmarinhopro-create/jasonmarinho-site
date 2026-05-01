/**
 * Shared email template, Jason Marinho
 * Dark Scandinavian design, consistent across all transactional emails.
 */

interface EmailOptions {
  title: string
  body: string          // Inner HTML for the card body (already formatted)
  preview?: string      // Preheader text (hidden, improves open rate)
}

const BG        = '#060d0b'
const CARD_BG   = '#0e1f18'
const BORDER    = '#1a3328'
const TEXT      = '#e8ede8'
const TEXT_MUTED = '#7a9e8a'
const ACCENT    = '#FFD56B'
const GREEN     = '#34D399'

export function buildEmail({ title, body, preview = '' }: EmailOptions): string {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escHtml(title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BG};-webkit-text-size-adjust:100%;mso-line-height-rule:exactly;">
  ${preview ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escHtml(preview)}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ''}

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};padding:48px 16px 64px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr><td style="padding-bottom:36px;" align="center">
          <span style="font-size:18px;font-weight:600;color:${TEXT};letter-spacing:-0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            Jason <em style="color:${ACCENT};font-style:italic;">Marinho</em>
          </span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:${CARD_BG};border:1px solid ${BORDER};border-radius:16px;padding:40px 36px 36px;">

          <!-- Title -->
          <h1 style="margin:0 0 24px;font-size:22px;font-weight:400;color:${TEXT};line-height:1.35;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.3px;">
            ${title}
          </h1>

          <!-- Separator -->
          <div style="width:32px;height:1px;background:${ACCENT};margin:0 0 28px;opacity:0.6;"></div>

          <!-- Body -->
          ${body}

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:32px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:${TEXT_MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            Jason Marinho &middot; Location Courte Durée
          </p>
          <p style="margin:0;font-size:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            <a href="https://app.jasonmarinho.com" style="color:${TEXT_MUTED};text-decoration:none;">app.jasonmarinho.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/** CTA button */
export function emailBtn(href: string, label: string, variant: 'primary' | 'secondary' | 'green' = 'primary'): string {
  const styles: Record<string, string> = {
    primary:   `background:${ACCENT};color:#0a0f0d;border:none;`,
    secondary: `background:transparent;color:${TEXT_MUTED};border:1px solid ${BORDER};`,
    green:     `background:${GREEN};color:#061208;border:none;`,
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:4px 0 20px;">
    <a href="${href}" style="display:inline-block;${styles[variant]}padding:14px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:0.1px;">
      ${label}
    </a>
  </td></tr></table>`
}

/** Highlighted info block */
export function emailInfoBlock(rows: { label: string; value: string }[], accentColor = ACCENT): string {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:6px 0;font-size:12px;color:${TEXT_MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;white-space:nowrap;padding-right:16px;">${escHtml(r.label)}</td>
      <td style="padding:6px 0;font-size:14px;color:${TEXT};font-weight:500;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${r.value}</td>
    </tr>`).join('')
  return `<div style="background:#0a1a13;border:1px solid ${BORDER};border-left:2px solid ${accentColor};border-radius:10px;padding:18px 20px;margin:0 0 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
  </div>`
}

/** Note block (security note, legal, etc.) */
export function emailNote(text: string): string {
  return `<div style="background:rgba(255,255,255,0.03);border:1px solid ${BORDER};border-radius:8px;padding:14px 18px;margin:20px 0 0;">
    <p style="margin:0;font-size:12px;color:${TEXT_MUTED};line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${text}</p>
  </div>`
}

/** Body text paragraph */
export function emailP(text: string): string {
  return `<p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:${TEXT_MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${text}</p>`
}

/** Simple HTML escape */
export function escHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
