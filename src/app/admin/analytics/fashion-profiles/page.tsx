import { AppFrame } from '../../../../components/AppFrame'
import FashionProfileAnalyticsRoute from './FashionProfileAnalyticsRoute'

export const dynamic = 'force-dynamic'

export default function FashionProfilesAnalyticsPage() {
  return (
    <AppFrame title="Fashion Profile Analytics" eyebrow="Admin">
      <FashionProfileAnalyticsRoute />
    </AppFrame>
  )
}
