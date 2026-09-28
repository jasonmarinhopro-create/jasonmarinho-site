// Les posts programmés ne partent pas à la minute près : le cron Vercel
// /api/cron/social-dispatch passe une fois par jour (vercel.json, 7 h UTC,
// plan Hobby). Un post prévu à 18 h part donc le lendemain matin.
// Garder SOCIAL_DISPATCH_HOUR_UTC aligné sur le cron de vercel.json.
export const SOCIAL_DISPATCH_HOUR_UTC = 7

/** Premier passage du cron à partir de l'heure prévue (incluse) */
export function nextDispatchRun(scheduled: Date, hourUtc = SOCIAL_DISPATCH_HOUR_UTC): Date {
  const run = new Date(Date.UTC(scheduled.getUTCFullYear(), scheduled.getUTCMonth(), scheduled.getUTCDate(), hourUtc, 0, 0))
  if (run.getTime() < scheduled.getTime()) run.setUTCDate(run.getUTCDate() + 1)
  return run
}
