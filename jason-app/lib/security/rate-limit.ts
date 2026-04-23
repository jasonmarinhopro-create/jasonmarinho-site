/**
 * Simple in-memory sliding-window rate limiter.
 *
 * NOTE: This is per-instance. For multi-instance deployments (Vercel) each node
 * has its own counter, so the effective limit is N * limit where N = instance count.
 * This is acceptable for basic abuse protection; for stricter guarantees swap to
 * Upstash Redis / @upstash/ratelimit.
 */

type Entry = { count: number; resetAt: number }

const BUCKETS = new Map<string, Map<string, Entry>>()

function getBucket(name: string): Map<string, Entry> {
  let bucket = BUCKETS.get(name)
  if (!bucket) {
    bucket = new Map()
    BUCKETS.set(name, bucket)
  }
  return bucket
}

/** Opportunistic cleanup to avoid unbounded memory growth. */
function sweep(bucket: Map<string, Entry>, now: number) {
  if (bucket.size < 500) return
  for (const [k, v] of bucket) if (v.resetAt < now) bucket.delete(k)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  bucketName: string,
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const bucket = getBucket(bucketName)
  const now = Date.now()
  sweep(bucket, now)
  const entry = bucket.get(key)
  if (!entry || entry.resetAt < now) {
    bucket.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }
  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count++
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt }
}

/** Extract client IP from the request — best effort behind proxies. */
export function getClientIp(req: Request | { headers: Headers }): string {
  const h = req.headers
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    'unknown'
  )
}
