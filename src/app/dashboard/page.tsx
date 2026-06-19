import type { Metadata } from 'next'
import DashboardRoute from './DashboardRoute'

export const metadata: Metadata = {
  title: 'Dashboard | FitFusion',
  description: 'Review wardrobe stats, weather-aware outfit recommendations, and FitFusion personalization signals.'
}

export default function DashboardPage() {
  return <DashboardRoute />
}
