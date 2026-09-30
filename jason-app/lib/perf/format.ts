// Texte des mesures de lenteur (pur, testé : format.test.ts). Les
// identifiants sont retirés des chemins (journaux GitHub publics).

export function cleanPath(path: string): string {
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<id>')
    .replace(/\/\d{3,}(?=\/|$)/g, '/<n>')
    .split('?')[0]
    .slice(0, 120)
}

export function slowMessage(kind: string, label: string, totalMs: number, steps: Array<[string, number]>): string {
  const detail = steps.filter(([, ms]) => ms >= 0).map(([n, ms]) => `${n} ${Math.round(ms)} ms`).join(', ')
  return `${kind} : ${cleanPath(label)} ${Math.round(totalMs)} ms${detail ? ` (${detail})` : ''}`.slice(0, 500)
}
