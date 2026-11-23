// Icônes des parcours et des badges de formation (23/11/2026 : remplacent les
// émojis, interdits dans les textes visibles).
import {
  RocketLaunch, CurrencyEur, Buildings, MapPin, ShieldCheck, GraduationCap, Books,
  Medal, Trophy, CalendarCheck, Lightning, Star, Crown, BookOpen,
} from '@phosphor-icons/react/dist/ssr'

const ICONS = {
  rocket: RocketLaunch, money: CurrencyEur, building: Buildings, pin: MapPin, shield: ShieldCheck,
  cap: GraduationCap, books: Books, medal: Medal, trophy: Trophy, calendar: CalendarCheck,
  bolt: Lightning, star: Star, crown: Crown, book: BookOpen,
} as const

export type FormationIconName = keyof typeof ICONS

export default function FormationIcon({ name, size = 22 }: { name: string; size?: number }) {
  const Icon = ICONS[name as FormationIconName] ?? BookOpen
  return <Icon size={size} weight="duotone" />
}
