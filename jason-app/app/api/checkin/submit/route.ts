// POST /api/checkin/submit — soumission publique du check-in en ligne.
// Aucune auth : le token unique (voyageurs.checkin_token) fait office de clé,
// comme /api/contracts/sign. Service role scoped par le token + whitelist
// stricte des champs modifiables.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { syncDeclarationsForVoyageur } from '@/lib/declarations/sync'
import { autoSendSibaForVoyageur } from '@/lib/declarations/siba-auto'

export const dynamic = 'force-dynamic'

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

const ID_TYPES = new Set(['cni', 'passeport', 'permis', 'autre'])

/** Nettoie une string user-submitted : trim + longueur max. */
function clean(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, max)
  return t || null
}

/** Code pays ISO-2 (2 lettres) ou null. */
function cleanCountry(v: unknown): string | null {
  const t = clean(v, 2)
  return t && /^[A-Za-z]{2}$/.test(t) ? t.toUpperCase() : null
}

/** Date YYYY-MM-DD valide ou null. */
function cleanDate(v: unknown): string | null {
  const t = clean(v, 10)
  if (!t || !/^\d{4}-\d{2}-\d{2}$/.test(t)) return null
  return isNaN(new Date(t).getTime()) ? null : t
}

export async function POST(req: Request) {
  // Rate limit : 10 soumissions / minute / IP (formulaire public)
  const ip = getClientIp(req)
  const limit = await rateLimit('checkin:submit', ip, 10, 60_000)
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Trop de tentatives, réessayez dans une minute.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  const token = clean(body.token, 64)
  if (!token || token.length < 16) {
    return NextResponse.json({ error: 'Lien invalide.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: voyageur } = await supabase
    .from('voyageurs')
    .select('id, user_id')
    .eq('checkin_token', token)
    .maybeSingle()
  if (!voyageur) {
    return NextResponse.json({ error: 'Lien invalide ou expiré.' }, { status: 404 })
  }

  // Champs requis
  const prenom = clean(body.prenom, 80)
  const nom = clean(body.nom, 80)
  const dateNaissance = cleanDate(body.date_naissance)
  const nationalite = cleanCountry(body.nationalite)
  const idTypeRaw = clean(body.id_type, 20)
  const idType = idTypeRaw && ID_TYPES.has(idTypeRaw) ? idTypeRaw : null
  const idNumero = clean(body.id_numero, 40)

  if (!prenom || !nom || !dateNaissance || !nationalite || !idType || !idNumero) {
    return NextResponse.json({ error: 'Champs requis manquants ou invalides.' }, { status: 400 })
  }

  // Signature électronique (mêmes garde-fous que /api/contracts/sign)
  const signatureImage = body.signature_image
  if (!signatureImage || typeof signatureImage !== 'string') {
    return NextResponse.json({ error: 'Signature requise.' }, { status: 400 })
  }
  const validImagePrefixes = ['data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/webp;base64,']
  if (!validImagePrefixes.some(p => signatureImage.startsWith(p))) {
    return NextResponse.json({ error: 'Format de signature invalide.' }, { status: 400 })
  }
  if (signatureImage.length > 5_000_000) {
    return NextResponse.json({ error: 'Signature trop volumineuse.' }, { status: 400 })
  }

  // Whitelist stricte : seuls ces champs sont modifiables par le voyageur.
  const update: Record<string, unknown> = {
    prenom,
    nom,
    date_naissance: dateNaissance,
    lieu_naissance: clean(body.lieu_naissance, 120),
    nationalite,
    id_type: idType,
    id_numero: idNumero,
    email: clean(body.email, 160),
    telephone: clean(body.telephone, 30),
    adresse: clean(body.adresse, 200),
    code_postal: clean(body.code_postal, 12),
    ville: clean(body.ville, 80),
    pays: cleanCountry(body.pays),
    id_pays_emetteur: cleanCountry(body.id_pays_emetteur),
    checkin_signature: signatureImage,
    checkin_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('voyageurs')
    .update(update)
    .eq('id', voyageur.id)
    .eq('checkin_token', token)
  if (error) {
    console.error('[checkin/submit] update failed:', error.message)
    return NextResponse.json({ error: 'Enregistrement impossible, réessayez.' }, { status: 500 })
  }

  // Best-effort : la nationalité vient (peut-être) d'arriver → recalcule les
  // déclarations obligatoires (SIBA…) pour les séjours de ce voyageur.
  try {
    await syncDeclarationsForVoyageur(supabase, voyageur.user_id, voyageur.id)
  } catch { /* ne bloque jamais le check-in */ }

  // Boucle fermée : l'identité est maintenant complète → envoi automatique
  // des boletins SIBA (logements PT configurés, opt-out par logement).
  // Best-effort : en cas de refus/config manquante, la déclaration reste
  // 'a_faire' et l'hôte la traite depuis le dashboard comme avant.
  try {
    await autoSendSibaForVoyageur(supabase, voyageur.user_id, voyageur.id)
  } catch { /* ne bloque jamais le check-in */ }

  return NextResponse.json({ ok: true })
}
