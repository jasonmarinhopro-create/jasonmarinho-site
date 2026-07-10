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

  // ── Mode « je m'ajoute au groupe » : le lien a été partagé, un membre du
  // groupe remplit SA fiche. On ajoute (ou met à jour, match nom + prénom +
  // naissance) UN accompagnant — sans toucher à la fiche du voyageur
  // principal ni aux autres membres.
  if (body.mode === 'companion') {
    const c = (typeof body.companion === 'object' && body.companion !== null ? body.companion : {}) as Record<string, unknown>
    const cPrenom = clean(c.prenom, 80)
    const cNom = clean(c.nom, 80)
    const cNaissance = cleanDate(c.date_naissance)
    const cNat = cleanCountry(c.nationalite)
    if (!cPrenom || !cNom || !cNaissance || !cNat) {
      return NextResponse.json({ error: 'Prénom, nom, naissance et nationalité sont requis.' }, { status: 400 })
    }
    // Signature de l'accompagnant (mêmes garde-fous que le mode principal)
    const cSig = body.signature_image
    if (!cSig || typeof cSig !== 'string') {
      return NextResponse.json({ error: 'Signature requise.' }, { status: 400 })
    }
    const sigPrefixes = ['data:image/png;base64,', 'data:image/jpeg;base64,', 'data:image/webp;base64,']
    if (!sigPrefixes.some(p => cSig.startsWith(p)) || cSig.length > 5_000_000) {
      return NextResponse.json({ error: 'Format de signature invalide.' }, { status: 400 })
    }

    const cIdTypeRaw = clean(c.id_type, 20)
    const row = {
      prenom: cPrenom,
      nom: cNom,
      date_naissance: cNaissance,
      lieu_naissance: clean(c.lieu_naissance, 120),
      nationalite: cNat,
      id_type: cIdTypeRaw && ID_TYPES.has(cIdTypeRaw) ? cIdTypeRaw : null,
      id_numero: clean(c.id_numero, 40),
      id_pays_emetteur: cleanCountry(c.id_pays_emetteur),
      checkin_signature: cSig,
      signed_at: new Date().toISOString(),
    }

    // Upsert applicatif : même personne (re-soumission pour corriger) → update.
    const { data: existing } = await supabase
      .from('checkin_companions')
      .select('id, prenom, nom, date_naissance')
      .eq('voyageur_id', voyageur.id)
      .eq('user_id', voyageur.user_id)
    const match = (existing ?? []).find(e =>
      (e.nom ?? '').trim().toLowerCase() === cNom.toLowerCase() &&
      (e.prenom ?? '').trim().toLowerCase() === cPrenom.toLowerCase() &&
      e.date_naissance === cNaissance
    )
    if (match) {
      const { error } = await supabase
        .from('checkin_companions')
        .update(row)
        .eq('id', match.id)
        .eq('user_id', voyageur.user_id)
      if (error) {
        console.error('[checkin/submit] companion update failed:', error.message)
        return NextResponse.json({ error: 'Enregistrement impossible, réessayez.' }, { status: 500 })
      }
    } else {
      if ((existing ?? []).length >= 12) {
        return NextResponse.json({ error: 'Nombre maximum de voyageurs atteint pour ce lien.' }, { status: 400 })
      }
      const { error } = await supabase
        .from('checkin_companions')
        .insert({ ...row, voyageur_id: voyageur.id, user_id: voyageur.user_id })
      if (error) {
        console.error('[checkin/submit] companion insert failed:', error.message)
        return NextResponse.json({ error: 'Enregistrement impossible, réessayez.' }, { status: 500 })
      }
    }

    // Un retardataire vient d'arriver : tente son envoi SIBA (les personnes
    // déjà déclarées sont tracées par siba_sent_at et ne repartent pas).
    try {
      await autoSendSibaForVoyageur(supabase, voyageur.user_id, voyageur.id)
    } catch { /* best-effort */ }

    return NextResponse.json({ ok: true })
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

  // Accompagnants (groupe sur le même lien) — max 8, champs nettoyés.
  // Identité requise ; document facultatif (les <15 ans peuvent ne pas en avoir).
  const companionsRaw = Array.isArray(body.companions) ? body.companions.slice(0, 8) : []
  const companions: Array<Record<string, string | null>> = []
  for (const c of companionsRaw) {
    if (typeof c !== 'object' || c === null) continue
    const cc = c as Record<string, unknown>
    const cPrenom = clean(cc.prenom, 80)
    const cNom = clean(cc.nom, 80)
    const cNaissance = cleanDate(cc.date_naissance)
    const cNat = cleanCountry(cc.nationalite)
    if (!cPrenom || !cNom || !cNaissance || !cNat) {
      return NextResponse.json({ error: 'Accompagnant incomplet (prénom, nom, naissance, nationalité requis).' }, { status: 400 })
    }
    const cIdTypeRaw = clean(cc.id_type, 20)
    companions.push({
      prenom: cPrenom,
      nom: cNom,
      date_naissance: cNaissance,
      lieu_naissance: clean(cc.lieu_naissance, 120),
      nationalite: cNat,
      id_type: cIdTypeRaw && ID_TYPES.has(cIdTypeRaw) ? cIdTypeRaw : null,
      id_numero: clean(cc.id_numero, 40),
      id_pays_emetteur: cleanCountry(cc.id_pays_emetteur),
    })
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

  // Accompagnants : remplacement complet — la dernière soumission fait foi.
  // On PRÉSERVE siba_sent_at (sinon re-déclaration SIBA en double) et la
  // signature d'un accompagnant qui s'est ajouté lui-même (match nom +
  // prénom + naissance) : une re-soumission du principal ne doit rien effacer.
  const { data: prevComps } = await supabase
    .from('checkin_companions')
    .select('prenom, nom, date_naissance, siba_sent_at, checkin_signature, signed_at')
    .eq('voyageur_id', voyageur.id)
    .eq('user_id', voyageur.user_id)
  const prevOf = (c: Record<string, string | null>) =>
    (prevComps ?? []).find(p =>
      (p.nom ?? '').trim().toLowerCase() === (c.nom ?? '').toLowerCase() &&
      (p.prenom ?? '').trim().toLowerCase() === (c.prenom ?? '').toLowerCase() &&
      p.date_naissance === c.date_naissance
    )

  const { error: delErr } = await supabase
    .from('checkin_companions')
    .delete()
    .eq('voyageur_id', voyageur.id)
    .eq('user_id', voyageur.user_id)
  if (!delErr && companions.length > 0) {
    const { error: insErr } = await supabase
      .from('checkin_companions')
      .insert(companions.map(c => {
        const prev = prevOf(c)
        return {
          ...c,
          siba_sent_at: prev?.siba_sent_at ?? null,
          checkin_signature: prev?.checkin_signature ?? null,
          signed_at: prev?.signed_at ?? null,
          voyageur_id: voyageur.id,
          user_id: voyageur.user_id,
        }
      }))
    if (insErr) console.error('[checkin/submit] companions insert failed:', insErr.message)
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
