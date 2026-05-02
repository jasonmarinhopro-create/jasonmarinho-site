/**
 * Rate limiter — Upstash Redis with in-memory fallback.
 *
 * If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set in env,
 * uses Upstash for cluster-wide accurate limits across all serverless
 * instances. Otherwise falls back to per-instance in-memory limiter
 * (only useful for local dev — multi-instance prod gives effective
 * limit = N × max).
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const HAS_UPSTASH = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

const redis = HAS_UPSTASH ? Redis.fromEnv() : null

// Cache one Ratelimit instance per (bucket, max, windowMs) tuple
const upstashCache = new Map<string, Ratelimit>()

function getUpstashLimiter(bucket: string, max: number, windowMs: number): Ratelimit {
  const cacheKey = `${bucket}:${max}:${windowMs}`
  let limiter = upstashCache.get(cacheKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(max, `${windowMs} ms`),
      analytics: false,
      prefix: `rl:${bucket}`,
    })
    upstashCache.set(cacheKey, limiter)
  }
  return limiter
}

// ── In-memory fallback (per-instance) ──────────────────────────
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

function sweep(bucket: Map<string, Entry>, now: number) {
  if (bucket.size < 500) return
  for (const [k, v] of bucket) if (v.resetAt < now) bucket.delete(k)
}

function memoryRateLimit(
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

// ── Public API ─────────────────────────────────────────────────
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export async function rateLimit(
  bucketName: string,
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (HAS_UPSTASH) {
    try {
      const limiter = getUpstashLimiter(bucketName, max, windowMs)
      const r = await limiter.limit(key)
      return {
        allowed: r.success,
        remaining: r.remaining,
        resetAt: r.reset,
      }
    } catch {
      // Network blip → fall back to memory rather than blocking the user
      return memoryRateLimit(bucketName, key, max, windowMs)
    }
  }
  return memoryRateLimit(bucketName, key, max, windowMs)
}

export function getClientIp(req: Request | { headers: Headers }): string {
  const h = req.headers
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    h.get('cf-connecting-ip') ||
    'unknown'
  )
}
