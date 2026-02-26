import { NextResponse, NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'

// In-memory rate limiting (Production should use Redis or Edge Config)
const globalLoginLimit = new Map()

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/logout']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1'

  // 1. Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && !request.nextUrl.protocol.startsWith('https')) {
    return NextResponse.redirect(`https://${request.nextUrl.host}${request.nextUrl.pathname}`, 301)
  }

  // 2. Basic Rate Limiting for Login (5 attempts per minute)
  if (pathname === '/api/auth/login') {
    const now = Date.now()
    const rateLimitKey = `login_${ip}`
    const attempts = globalLoginLimit.get(rateLimitKey) || []
    const recentAttempts = attempts.filter((t: number) => now - t < 60000)

    if (recentAttempts.length >= 5) {
      return NextResponse.json({ success: false, error: 'Too many login attempts. Please try again in a minute.' }, { status: 429 })
    }

    globalLoginLimit.set(rateLimitKey, [...recentAttempts, now])
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check for session in cookies or Authorization header
  const sessionCookie = request.cookies.get('session')?.value
  const authHeader = request.headers.get('Authorization')?.replace('Bearer ', '')

  const session = await verifySession(sessionCookie || authHeader || '')

  if (!session && !pathname.startsWith('/api')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!session && pathname.startsWith('/api')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // ✅ Inject session context into the FORWARDED REQUEST headers (not response).
  // NextResponse.next({ request }) is the correct Next.js pattern so that
  // API route handlers can read these via request.headers.get().
  if (session) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('X-User-ID', session.userId.toString())
    requestHeaders.set('X-User-Role', session.role)
    if (session.storeId != null) {
      requestHeaders.set('X-Store-ID', session.storeId.toString())
    }
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return NextResponse.next()
}

// Protect all routes except public ones and static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
