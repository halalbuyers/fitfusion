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
  '/stylist(.*)',
  '/wardrobe(.*)',
  '/api(.*)'
])
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const session = await auth.protect()
    if (isAdminRoute(req) && !(await isAdmin({ userId: session.userId, sessionClaims: session.sessionClaims }))) {
      if (req.nextUrl.pathname.startsWith('/api/admin')) {
        return new Response('Access Denied', { status: 403 })
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
