import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/security/rate-limit'
import { isEmail, isPassword, normalizeEmail } from '@/lib/security/validate'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const ipLimit = rateLimit('login:ip', ip, 10, 60_000)
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const { email, password } = await req.json()

    if (!isEmail(email) || !isPassword(password)) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 400 })
    }

    const emailLimit = rateLimit('login:email', normalizeEmail(email), 5, 15 * 60_000)
    if (!emailLimit.allowed) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        return NextResponse.json({ error: 'EMAIL_NOT_CONFIRMED' }, { status: 401 })
      }
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[login] error:', e)
    return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 500 })
  }
}
