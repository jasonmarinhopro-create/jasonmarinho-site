'use client'

// Client-side helper for marking onboarding steps as done.
// Uses localStorage to dedup so we don't hit the server on every action
// once a step has already been validated.

import { markOnboardingStep } from './actions'

const STORAGE_KEY = 'onboarding-marked-v1'

function readMarked(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch { return new Set() }
}

function writeMarked(set: Set<string>) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set))) } catch {}
}

/**
 * Marque une étape d'onboarding comme faite — idempotent côté client.
 * À appeler après une action concrète (copie d'un gabarit, visite d'une page, etc.).
 */
export async function markStepIfNotYet(stepKey: string): Promise<void> {
  const marked = readMarked()
  if (marked.has(stepKey)) return
  marked.add(stepKey)
  writeMarked(marked)
  try { await markOnboardingStep(stepKey, true) } catch { /* best-effort */ }
}
