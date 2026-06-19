'use client'

import { ClerkProvider } from '@clerk/nextjs'
import React from 'react'
import { OnboardingGuard } from './OnboardingGuard'

export default function ClerkBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY as string}>
      <OnboardingGuard>{children}</OnboardingGuard>
    </ClerkProvider>
  )
}
