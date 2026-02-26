import { NextResponse, NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'

// In-memory rate limiting (Production should use Redis or Edge Config)
const globalLoginLimit = new Map()

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/api/auth/logout']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // Define allowed origins
  const allowedOrigins = [
    'https://multi-pos-eight.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ]

  // Handle CORS
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)

  // Preflight request handling
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Store-ID, X-User-Role',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1'

  // 1. Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && !request.nextUrl.protocol.startsWith('https')) {
    const response = NextResponse.redirect(`https://${request.nextUrl.host}${request.nextUrl.pathname}`, 301)
    if (isAllowedOrigin) response.headers.set('Access-Control-Allow-Origin', origin)
    return response
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
    const response = NextResponse.next()
    if (isAllowedOrigin) response.headers.set('Access-Control-Allow-Origin', origin)
    return response
  }

  // Check for session in cookies or Authorization header
  const sessionCookie = request.cookies.get('session')?.value
  const authHeader = request.headers.get('Authorization')?.replace('Bearer ', '')

  const session = await verifySession(sessionCookie || authHeader || '')

  if (!session && !pathname.startsWith('/api')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    const response = NextResponse.redirect(loginUrl)
    if (isAllowedOrigin) response.headers.set('Access-Control-Allow-Origin', origin)
    return response
  }

  if (!session && pathname.startsWith('/api')) {
    const response = NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    if (isAllowedOrigin) response.headers.set('Access-Control-Allow-Origin', origin)
    return response
  }

  // ✅ Inject session context into the FORWARDED REQUEST headers (not response).
  if (session) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('X-User-ID', session.userId.toString())
    requestHeaders.set('X-User-Role', session.role)
    if (session.storeId != null) {
      requestHeaders.set('X-Store-ID', session.storeId.toString())
    }
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    if (isAllowedOrigin) response.headers.set('Access-Control-Allow-Origin', origin)
    return response
  }

  const response = NextResponse.next()
  if (isAllowedOrigin) response.headers.set('Access-Control-Allow-Origin', origin)
  return response
}

// Protect all routes except public ones and static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
