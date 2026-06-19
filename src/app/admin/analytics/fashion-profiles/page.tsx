import { AppFrame } from '../../../../components/AppFrame'
import FashionProfileAnalyticsRoute from './FashionProfileAnalyticsRoute'
import { isAdmin } from '../../../../lib/auth/admin'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function FashionProfilesAnalyticsPage() {
  if (!(await isAdmin())) redirect('/')
  
  return (
    <AppFrame title="Fashion Profile Analytics" eyebrow="Admin">
      <FashionProfileAnalyticsRoute />
    </AppFrame>
  )
}
