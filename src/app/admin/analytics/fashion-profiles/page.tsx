import { AppFrame } from '../../../../components/AppFrame'
import { FashionProfileAnalytics } from '../../../../components/FashionProfileAnalytics'
import { isAdmin } from '../../../../lib/auth/admin'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function FashionProfilesAnalyticsPage() {
  if (!(await isAdmin())) redirect('/')
  
  return (
    <AppFrame title="Fashion Profile Analytics" eyebrow="Admin">
      <Suspense fallback={<div>Loading...</div>}>
        <FashionProfileAnalytics />
      </Suspense>
    </AppFrame>
  )
}
