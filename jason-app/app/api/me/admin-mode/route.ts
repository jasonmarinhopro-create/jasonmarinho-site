// GET /api/me/admin-mode : retire le cookie du mode admin (lib/admin-mode.ts)
// puis renvoie à l'Accueil. Utilisé quand un compte non admin arrive sur la
// Vue d'ensemble avec ce cookie, pour éviter la boucle middleware → admin →
// accueil. Le cookie n'est qu'un réglage d'affichage, jamais un droit.
import { NextResponse } from 'next/server'
import { ADMIN_MODE_COOKIE } from '@/lib/admin-mode'

export const dynamic = 'force-dynamic'

export function GET(req: Request) {
  const res = NextResponse.redirect(new URL('/dashboard', req.url))
  res.cookies.set(ADMIN_MODE_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
