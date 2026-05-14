import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Route de résolution pseudo → user_id pour les mentions @pseudo dans les
 * messages Chez Nous. Redirige vers /dashboard/chez-nous/membre/[userId]
 * si le pseudo existe, sinon 404.
 *
 * Pourquoi une route séparée plutôt qu'un mapping côté client : on n'a
 * pas tous les pseudos en mémoire dans le feed (et on ne veut pas les
 * pré-charger pour rien). Cette route est appelée seulement quand
 * l'utilisateur clique sur @pseudo, une seule query rapide.
 */
export default async function PseudoRedirectPage({ params }: { params: Promise<{ pseudo: string }> }) {
  const { pseudo } = await params
  const cleaned = decodeURIComponent(pseudo).trim()
  if (!/^[a-zA-Z0-9_-]{2,30}$/.test(cleaned)) notFound()

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('pseudo', cleaned)
    .maybeSingle()

  if (!data) notFound()
  redirect(`/dashboard/chez-nous/membre/${data.id}`)
}
