'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import React from 'react'

const ClerkBoundary = dynamic(() => import('./ClerkBoundary'), {
  loading: () => null
})

const clerkRoutePrefixes = [
  '/admin',
  '/calendar',
  '/community',
  '/dashboard',
  '/login',
  '/my-wardrobe',
  '/onboarding',
  '/outfit-generator',
  '/outfits',
  '/profile',
  '/register',
  '/settings',
  '/shopping',
  '/stylist',
  '/try-on',
  '/wardrobe',
  '/weather'
]

function needsClerk(pathname: string) {
  return clerkRoutePrefixes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/'

  if (!needsClerk(pathname)) return <>{children}</>

  return <ClerkBoundary>{children}</ClerkBoundary>
}
