import { NextResponse } from 'next/server'
import { ACTIVE_PROPERTY_COOKIE } from '@/lib/queries/active-property'

// /dashboard/finances/logement/<id>?onglet=performances : affiche « Mes
// finances » pour ce logement (même cookie que le sélecteur de la sidebar).
// getActiveProperty() revérifie que le logement appartient à l'utilisateur.
const ONGLETS = ['revenus', 'journal', 'performances', 'fiscalite', 'encaissements']

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url)
  const onglet = url.searchParams.get('onglet')
  const dest = new URL(`/dashboard/finances/${onglet && ONGLETS.includes(onglet) ? onglet : 'revenus'}`, url.origin)
  const res = NextResponse.redirect(dest)
  res.cookies.set({
    name: ACTIVE_PROPERTY_COOKIE,
    value: decodeURIComponent(params.id),
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  return res
}
