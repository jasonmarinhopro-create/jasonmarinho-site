// Réseaux sociaux et fiche Google d'un pro sur sa fiche publique (07/10/2026).
// Même liste que jason-app/lib/pros/reseaux.ts (test de synchro dans l'app).
// Les liens sont revérifiés ici (https + domaine du réseau) avant affichage :
// jamais d'adresse arbitraire sur une page publique.

export const PRO_RESEAUX = [
  { key: 'google', label: 'Fiche Google', icon: 'google-logo', hosts: ['google.com', 'google.fr', 'maps.app.goo.gl', 'goo.gl', 'g.page', 'g.co', 'share.google', 'business.site'] },
  { key: 'facebook', label: 'Facebook', icon: 'facebook-logo', hosts: ['facebook.com', 'fb.com', 'fb.me'] },
  { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin-logo', hosts: ['linkedin.com', 'lnkd.in'] },
  { key: 'tiktok', label: 'TikTok', icon: 'tiktok-logo', hosts: ['tiktok.com'] },
  { key: 'youtube', label: 'YouTube', icon: 'youtube-logo', hosts: ['youtube.com', 'youtu.be'] },
  { key: 'pinterest', label: 'Pinterest', icon: 'pinterest-logo', hosts: ['pinterest.com', 'pinterest.fr', 'pin.it'] },
]

const escHtml = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Liens affichables d'une fiche, dans l'ordre de PRO_RESEAUX, Instagram en tête s'il existe */
export function proReseauxLinks(reseaux, instagramHandle) {
  const out = []
  const ig = String(instagramHandle ?? '').trim().replace(/^@/, '')
  if (/^[\w.]{1,30}$/.test(ig)) out.push({ key: 'instagram', label: 'Instagram', icon: 'instagram-logo', url: `https://instagram.com/${ig}` })
  const raw = reseaux && typeof reseaux === 'object' ? reseaux : {}
  for (const r of PRO_RESEAUX) {
    const v = raw[r.key]
    if (typeof v !== 'string') continue
    let u
    try { u = new URL(v) } catch { continue }
    const host = u.hostname.toLowerCase().replace(/^www\./, '')
    if (u.protocol !== 'https:' || !r.hosts.some(h => host === h || host.endsWith(`.${h}`))) continue
    out.push({ key: r.key, label: r.label, icon: r.icon, url: u.toString() })
  }
  return out
}

/**
 * Rangée discrète de pastilles rondes (icône seule, nom au survol et pour
 * les lecteurs d'écran). Styles en ligne : fonctionne dans les deux gabarits
 * de fiche.
 */
export function proReseauxHtml(links, { title = 'Retrouve-moi aussi sur' } = {}) {
  if (!links.length) return ''
  const items = links.map(l => `<a href="${escHtml(l.url)}" target="_blank" rel="noopener noreferrer me" title="${escHtml(l.label)}" aria-label="${escHtml(l.label)}" style="width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;border:1px solid rgba(0,76,63,.16);background:#fff;color:#004C3F;text-decoration:none;font-size:16px;transition:border-color .15s,background .15s" onmouseover="this.style.background='rgba(0,76,63,.06)';this.style.borderColor='rgba(0,76,63,.35)'" onmouseout="this.style.background='#fff';this.style.borderColor='rgba(0,76,63,.16)'"><i class="ph-bold ph-${l.icon}" aria-hidden="true"></i></a>`).join('')
  return `<div class="pro-reseaux" style="margin-top:14px">
      <div style="font-size:11px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:#7A8C77;margin-bottom:8px">${escHtml(title)}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">${items}</div>
    </div>`
}
