'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const { userId, isLoaded } = useAuth()

  const skipOnboardingRoutes = [
    '/login',
    '/register',
    '/onboarding',
    '/api',
    '/'
  ]

  const shouldSkipCheck = skipOnboardingRoutes.some(route => 
    pathname.startsWith(route)
  )

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isLoaded || !userId || shouldSkipCheck) return

      try {
        const response = await fetch('/api/fashion-profile')
        const data = await response.json()

        if (!data.hasCompletedOnboarding && pathname !== '/onboarding') {
          router.push('/onboarding')
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      }
    }

    checkOnboarding()
  }, [isLoaded, userId, pathname, shouldSkipCheck, router])

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-[#d7ff55]" />
      </div>
    )
  }

  return children
}
