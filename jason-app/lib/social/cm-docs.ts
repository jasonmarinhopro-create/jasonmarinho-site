// Documents du community manager lus depuis le dépôt public (24/10/2026) :
// dernier rapport du dimanche (data/social/rapports/) et règles du moment
// (data/social/APPRENTISSAGES.md). Aucun nom de personne dedans (dépôt public).

const REPO = 'jasonmarinhopro-create/jasonmarinho-site'
const RAW = `https://raw.githubusercontent.com/${REPO}/main`

export interface CmDocs {
  report: { date: string; text: string } | null
  learnings: string | null
}

async function text(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(4000) })
    return res.ok ? await res.text() : null
  } catch { return null }
}

export async function loadCmDocs(): Promise<CmDocs> {
  const [listRaw, learnings] = await Promise.all([
    text(`https://api.github.com/repos/${REPO}/contents/data/social/rapports?ref=main`),
    text(`${RAW}/data/social/APPRENTISSAGES.md`),
  ])
  let report: CmDocs['report'] = null
  try {
    const files = (JSON.parse(listRaw ?? '[]') as Array<{ name: string }>)
      .map(f => f.name).filter(n => /^\d{4}-\d{2}-\d{2}\.md$/.test(n)).sort()
    const last = files.at(-1)
    if (last) {
      const body = await text(`${RAW}/data/social/rapports/${last}`)
      if (body) report = { date: last.slice(0, 10), text: body }
    }
  } catch { /* liste illisible : pas de rapport affiché */ }
  return { report, learnings }
}
