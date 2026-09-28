import {
  FacebookLogo, InstagramLogo, PinterestLogo, LinkedinLogo, XLogo,
} from '@phosphor-icons/react/dist/ssr'

// Couleurs de la marque, pas celles des plateformes (pas de bleu Facebook ni
// LinkedIn : demande de Jason, sept. 2026). Facebook en vert, Instagram en rose.
export const PLATFORM_META: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  facebook:  { label: 'Facebook',  Icon: FacebookLogo,  color: 'var(--accent-text)' },
  instagram: { label: 'Instagram', Icon: InstagramLogo, color: '#B83A7C' },
  pinterest: { label: 'Pinterest', Icon: PinterestLogo, color: '#C2344A' },
  x:         { label: 'X',         Icon: XLogo,         color: 'var(--text)' },
  linkedin:  { label: 'LinkedIn',  Icon: LinkedinLogo,  color: '#6E5446' },
}

// Statuts d'une cible, en clair
export const TARGET_STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', publishing: 'En cours', published: 'Publié', failed: 'Échec',
}
export const IMPLEMENTED_PLATFORMS = ['facebook', 'instagram']
export const ALL_PLATFORMS = ['instagram', 'facebook', 'pinterest', 'x', 'linkedin']
