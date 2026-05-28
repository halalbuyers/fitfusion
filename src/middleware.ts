import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

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

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
