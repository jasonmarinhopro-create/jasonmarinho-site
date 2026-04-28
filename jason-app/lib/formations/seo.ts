// Phase 5 — Helpers SEO pour les pages formation
// Génère metadata Next.js (title, description, OpenGraph, Twitter)
// + structured data Course schema.org (JSON-LD)

import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.jasonmarinho.com'
const PROVIDER = {
  '@type': 'Organization' as const,
  name: 'Jason Marinho',
  sameAs: 'https://jasonmarinho.com',
}

interface FormationSeoInput {
  slug: string
  title: string
  description: string
  duration: string
  level: string
  modules?: Array<{ title: string }>
  ogImage?: string // optionnel : surcharge image OG
}

/** Génère les meta pour une page formation */
export function buildFormationMetadata(input: FormationSeoInput): Metadata {
  const url = `${APP_URL}/dashboard/formations/${input.slug}`
  const title = `${input.title} — Formation LCD · Jason Marinho`
  const description = input.description.slice(0, 200)
  const ogImage = input.ogImage ?? `${APP_URL}/og-formation-default.png`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: 'Jason Marinho — Plateforme LCD',
      images: [{ url: ogImage, width: 1200, height: 630, alt: input.title }],
      locale: 'fr_FR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: { index: false, follow: false }, // dashboard authentifié, pas indexable
  }
}

/** JSON-LD Course schema.org */
export function buildCourseSchema(input: FormationSeoInput): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: input.title,
    description: input.description,
    provider: PROVIDER,
    url: `${APP_URL}/dashboard/formations/${input.slug}`,
    inLanguage: 'fr',
    educationalLevel: input.level,
    timeRequired: parseDurationToISO8601(input.duration),
    hasCourseInstance: [
      {
        '@type': 'CourseInstance',
        courseMode: 'Online',
        courseWorkload: parseDurationToISO8601(input.duration),
      },
    ],
    ...(input.modules && input.modules.length > 0 && {
      hasPart: input.modules.map((m, i) => ({
        '@type': 'CourseInstance',
        position: i + 1,
        name: m.title,
      })),
    }),
  }
  return JSON.stringify(data)
}

/** Convertit "2h30" / "30 min" → "PT2H30M" / "PT30M" */
function parseDurationToISO8601(d: string): string {
  if (!d) return 'PT1H'
  const hMatch = d.match(/(\d+)\s*h/i)
  const mMatch = d.match(/(\d+)\s*min/i)
  // Si c'est juste "2h30" sans "min", parse les minutes après le h
  const h2Match = d.match(/(\d+)h(\d+)/i)
  let h = 0, m = 0
  if (h2Match) { h = parseInt(h2Match[1], 10); m = parseInt(h2Match[2], 10) }
  else {
    if (hMatch) h = parseInt(hMatch[1], 10)
    if (mMatch) m = parseInt(mMatch[1], 10)
  }
  if (h === 0 && m === 0) return 'PT1H'
  let out = 'PT'
  if (h > 0) out += `${h}H`
  if (m > 0) out += `${m}M`
  return out
}
