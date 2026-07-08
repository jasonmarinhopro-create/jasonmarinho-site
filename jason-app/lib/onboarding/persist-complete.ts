// SERVER ONLY — backfill paresseux du flag onboarding_completed_at.
//
// detectTracksProgress (7 requêtes non cachables) tournait à CHAQUE nav du
// dashboard, y compris pour les hôtes qui ont déjà tout terminé (le widget
// Parcours ne s'affiche alors même pas). Le flag onboarding_completed_at
// n'était jamais écrit (syncOnboardingStep n'est appelé nulle part).
//
// Ici : dès que la détection conclut que tout est terminé, on écrit le flag
// UNE fois. Les navigations suivantes lisent le flag (profil caché) et
// sautent complètement detectTracksProgress → dashboard plus rapide.

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { invalidateProfileCache } from '@/lib/queries/profile'

export async function persistOnboardingCompleted(userId: string): Promise<void> {
  try {
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    // .is('onboarding_completed_at', null) → écrit une seule fois, idempotent.
    const { error } = await admin
      .from('profiles')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', userId)
      .is('onboarding_completed_at', null)
    if (!error) invalidateProfileCache(userId)
  } catch {
    /* best-effort : ne doit jamais casser le rendu du layout */
  }
}
