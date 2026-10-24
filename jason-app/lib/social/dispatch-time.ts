// Les posts programmés ne partent pas à la minute près. Passages qui publient
// les posts dus :
// - le cron Vercel /api/cron/social-dispatch, une fois par jour (vercel.json,
//   7 h UTC, plan Hobby) ;
// - depuis le 24/10/2026, le workflow « Réseaux sociaux » à 17 h 05 et
//   17 h 50 UTC (posts de la routine Community manager, prévus à 17 h UTC) ;
// - un second cron Vercel à 17 h 05 UTC (« ?soir=1 »), filet de secours : le
//   24/10/2026 le passage GitHub de 17 h 05 ne s'est pas déclenché et le
//   premier carrousel a dû partir à la main (Hobby : dans l'heure, pas à la
//   minute près).
// Un post prévu à 18 h (Paris) part donc vers 18 h 05, un post prévu à 21 h
// le lendemain matin. Garder ces horaires alignés sur vercel.json et
// .github/workflows/reseaux-sociaux.yml (test).
export const SOCIAL_DISPATCH_HOUR_UTC = 7
export const WORKFLOW_DISPATCH_UTC: Array<[number, number]> = [[17, 5], [17, 50]]

/** Premier passage (cron Vercel ou workflow) à partir de l'heure prévue (incluse) */
export function nextDispatchRun(scheduled: Date, hourUtc = SOCIAL_DISPATCH_HOUR_UTC): Date {
  const slots: Array<[number, number]> = [[hourUtc, 0], ...WORKFLOW_DISPATCH_UTC]
  for (let day = 0; day < 2; day++) {
    const runs = slots
      .map(([h, m]) => new Date(Date.UTC(scheduled.getUTCFullYear(), scheduled.getUTCMonth(), scheduled.getUTCDate() + day, h, m, 0)))
      .filter(r => r.getTime() >= scheduled.getTime())
      .sort((a, b) => a.getTime() - b.getTime())
    if (runs.length) return runs[0]
  }
  return scheduled
}
