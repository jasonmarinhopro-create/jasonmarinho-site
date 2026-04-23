/**
 * Structured server-side logger.
 *
 * Outputs JSON lines in production (easily parsed by Vercel Log Drains)
 * and pretty-prints in development.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   const log = logger('api/login')
 *   log.error('signIn failed', { code: error.code })
 */

type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  ts: string
  level: LogLevel
  route: string
  msg: string
  data?: unknown
}

const isProd = process.env.NODE_ENV === 'production'

function write(level: LogLevel, route: string, msg: string, data?: unknown) {
  const entry: LogEntry = {
    ts:    new Date().toISOString(),
    level,
    route,
    msg,
    ...(data !== undefined ? { data } : {}),
  }

  if (isProd) {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    fn(JSON.stringify(entry))
  } else {
    const prefix = `[${entry.ts.slice(11, 23)}] [${level.toUpperCase()}] [${route}]`
    if (data !== undefined) {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](prefix, msg, data)
    } else {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](prefix, msg)
    }
  }
}

export function logger(route: string) {
  return {
    info:  (msg: string, data?: unknown) => write('info',  route, msg, data),
    warn:  (msg: string, data?: unknown) => write('warn',  route, msg, data),
    error: (msg: string, data?: unknown) => write('error', route, msg, data),
  }
}
