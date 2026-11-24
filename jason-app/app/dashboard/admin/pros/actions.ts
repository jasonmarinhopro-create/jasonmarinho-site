'use server'

import { revalidatePath } from 'next/cache'
import { deleteUnpaidFiche, setFicheHidden, type AdminResult } from '@/lib/pros/admin-fiche'
import { KINDS, type ProKind } from '@/lib/pros/metiers'

// Actions de la page admin Pros (24/11/2026) : code commun aux 3 métiers
// (lib/pros/admin-fiche.ts vérifie le rôle admin et l'état de la fiche).
const PATH = '/dashboard/admin/pros'
const ok = (k: string): k is ProKind => (KINDS as readonly string[]).includes(k)

export async function setProHidden(kind: string, id: string, hidden: boolean): Promise<AdminResult> {
  if (!ok(kind)) return { error: 'Métier inconnu' }
  const r = await setFicheHidden(kind, id, hidden)
  if (r.success) revalidatePath(PATH)
  return r
}

export async function deleteUnpaidPro(kind: string, id: string): Promise<AdminResult> {
  if (!ok(kind)) return { error: 'Métier inconnu' }
  const r = await deleteUnpaidFiche(kind, id)
  if (r.success) revalidatePath(PATH)
  return r
}
