import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isAdmin } from './lib/auth/admin'

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/calendar(.*)',
  '/community(.*)',
  '/dashboard(.*)',
  '/my-wardrobe(.*)',
  '/outfit-generator(.*)',
  '/outfits(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/stylist(.*)',
  '/try-on(.*)',
  '/wardrobe(.*)',
  '/weather(.*)',
  '/api(.*)'
])
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)'])
const isPublicRoute = createRouteMatcher(['/api/announcements'])
const isApiRoute = createRouteMatcher(['/api(.*)'])

function loginRedirect(req: Request) {
  const url = new URL('/login', req.url)
  const current = new URL(req.url)
  url.searchParams.set('redirect_url', `${current.pathname}${current.search}`)
  return NextResponse.redirect(url)
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next()

  if (isProtectedRoute(req)) {
    const session = await auth()

    if (!session.userId) {
      if (isApiRoute(req)) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
      return loginRedirect(req)
    }

    if (isAdminRoute(req) && !(await isAdmin({ userId: session.userId, sessionClaims: session.sessionClaims }))) {
      if (req.nextUrl.pathname.startsWith('/api/admin')) {
        return NextResponse.json({ success: false, error: 'Access Denied' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/calendar/:path*',
    '/community/:path*',
    '/dashboard/:path*',
    '/my-wardrobe/:path*',
    '/outfit-generator/:path*',
    '/outfits/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/stylist/:path*',
    '/try-on/:path*',
    '/wardrobe/:path*',
    '/weather/:path*',
    '/api/:path*'
  ]
}
