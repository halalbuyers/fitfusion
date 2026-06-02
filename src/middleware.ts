import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/calendar(.*)',
  '/community(.*)',
  '/dashboard(.*)',
  '/my-wardrobe(.*)',
  '/outfit-generator(.*)',
  '/outfits(.*)',
  '/profile(.*)',
  '/stylist(.*)',
  '/wardrobe(.*)',
  '/api(.*)'
])
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)'])

function hasAdminClaim(claims?: any) {
  const role = claims?.publicMetadata?.role || claims?.metadata?.publicMetadata?.role
  return String(role || '').toLowerCase() === 'admin'
}

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const session = await auth.protect()
    if (isAdminRoute(req) && !hasAdminClaim(session.sessionClaims)) {
      if (req.nextUrl.pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Access Denied' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
