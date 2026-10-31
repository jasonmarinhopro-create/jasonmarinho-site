'use server'

import { revalidatePath } from 'next/cache'
import { deleteUnpaidFiche, setFicheHidden, type AdminResult } from '@/lib/pros/admin-fiche'

const PATH = '/dashboard/admin/depannage'

export async function hideDepannage(id: string): Promise<AdminResult> {
  const r = await setFicheHidden('depannage', id, true)
  if (r.success) revalidatePath(PATH)
  return r
}

export async function unhideDepannage(id: string): Promise<AdminResult> {
  const r = await setFicheHidden('depannage', id, false)
  if (r.success) revalidatePath(PATH)
  return r
}

export async function deleteUnpaidDepannage(id: string): Promise<AdminResult> {
  const r = await deleteUnpaidFiche('depannage', id)
  if (r.success) revalidatePath(PATH)
  return r
}
