import {
  FacebookLogo, InstagramLogo, PinterestLogo, LinkedinLogo, XLogo,
} from '@phosphor-icons/react/dist/ssr'

export const PLATFORM_META: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  facebook:  { label: 'Facebook',  Icon: FacebookLogo,  color: '#1877F2' },
  instagram: { label: 'Instagram', Icon: InstagramLogo, color: '#C13584' },
  pinterest: { label: 'Pinterest', Icon: PinterestLogo, color: '#E60023' },
  x:         { label: 'X',         Icon: XLogo,         color: 'var(--text)' },
  linkedin:  { label: 'LinkedIn',  Icon: LinkedinLogo,  color: '#0A66C2' },
}
export const IMPLEMENTED_PLATFORMS = ['facebook', 'instagram']
export const ALL_PLATFORMS = ['instagram', 'facebook', 'pinterest', 'x', 'linkedin']
