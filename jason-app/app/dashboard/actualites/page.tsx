import ActualitesScreen from '@/components/actualites/ActualitesScreen'

export const metadata = { title: 'Actualités LCD, Jason Marinho' }

export interface Actualite {
  id: string
  title: string
  summary: string
  source_url: string | null
  category: string
  published_at: string | null
  created_at: string
  deadline_date?: string | null
  is_pinned?: boolean | null
  regions?: string[] | null
  read_time_minutes?: number | null
}

export default function ActualitesPage() {
  return <ActualitesScreen audience="hote" />
}
