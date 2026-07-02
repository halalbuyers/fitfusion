'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const { userId, isLoaded } = useAuth()

  const onboardingRoutePrefixes = [
    '/admin',
    '/calendar',
    '/community',
    '/dashboard',
    '/my-wardrobe',
    '/outfit-generator',
    '/outfits',
    '/profile',
    '/settings',
    '/shopping',
    '/stylist',
    '/trips',
    '/try-on',
    '/wardrobe',
    '/weather'
  ]

  const shouldCheckOnboarding = onboardingRoutePrefixes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  )

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isLoaded || !userId || !shouldCheckOnboarding) return

      try {
        const response = await fetch('/api/fashion-profile')
        const data = await response.json()

        if (!data.hasCompletedOnboarding && pathname !== '/onboarding') {
          router.replace('/onboarding')
        }
      } catch {
        return
      }
    }

    checkOnboarding()
  }, [isLoaded, userId, pathname, shouldCheckOnboarding, router])

  if (!shouldCheckOnboarding) return children

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-[#d7ff55]" />
      </div>
    )
  }

  return children
}
