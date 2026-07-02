'use client'

import React from 'react'
import ClerkBoundary from './ClerkBoundary'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <ClerkBoundary>{children}</ClerkBoundary>
}
