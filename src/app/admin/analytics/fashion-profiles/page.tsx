'use client'

import { AppFrame } from '../../../components/AppFrame'
import { FashionProfileAnalytics } from '../../../components/FashionProfileAnalytics'
import { isAdmin } from '../../../lib/auth/admin'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function FashionProfilesAnalyticsPage() {
  // Note: Client-side check needed since we can't use async server-side in 'use client' context
  // Instead, rely on API endpoint's admin check
  
  return (
    <AppFrame title="Fashion Profile Analytics" eyebrow="Admin">
      <Suspense fallback={<div>Loading...</div>}>
        <FashionProfileAnalytics />
      </Suspense>
    </AppFrame>
  )
}
