import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ACTIVE_PROPERTY_COOKIE, ALL_PROPERTIES } from '@/lib/queries/active-property'

// POST { propertyId: string | 'all' }
// Persiste le logement actif dans un cookie 1 an. Pas besoin de valider que
// le logement appartient à l'utilisateur ici : getActiveProperty() le fait
// déjà au prochain rendu (silencieux fallback sur 'all' si invalide).
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const id = String(body?.propertyId ?? ALL_PROPERTIES)
  const cookieStore = await cookies()
  cookieStore.set({
    name: ACTIVE_PROPERTY_COOKIE,
    value: id,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return NextResponse.json({ ok: true, propertyId: id })
}
