/**
 * Helpers to display a member identity (pseudo or first name)
 * across Chez Nous + member profiles.
 */

export type MemberDisplay = {
  pseudo: string | null
  full_name: string | null
}

export function displayName(m: MemberDisplay): string {
  const pseudo = m.pseudo?.trim()
  if (pseudo) return pseudo
  const first = m.full_name?.trim().split(/\s+/)[0]
  return first || 'Anonyme'
}

export function displayInitials(m: MemberDisplay): string {
  const name = displayName(m)
  const parts = name.split(/\s+/)
  return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

const COLORS = [
  { bg: 'rgba(255,213,107,0.18)', text: '#ffd56b' },
  { bg: 'rgba(167,139,250,0.16)', text: '#a78bfa' },
  { bg: 'rgba(96,165,250,0.16)',  text: '#60a5fa' },
  { bg: 'rgba(52,211,153,0.16)',  text: '#34d399' },
  { bg: 'rgba(251,113,133,0.16)', text: '#fb7185' },
  { bg: 'rgba(251,146,60,0.16)',  text: '#fb923c' },
  { bg: 'rgba(244,114,182,0.16)', text: '#f472b6' },
]

export function colorFromId(id: string): { bg: string; text: string } {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

export function formatRelative(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)        return 'à l\'instant'
  if (diff < 3600)      return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400)     return `il y a ${Math.floor(diff / 3600)} h`
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
