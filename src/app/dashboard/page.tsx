import type { Metadata } from 'next'
import DashboardRoute from './DashboardRoute'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Review wardrobe stats, weather-aware outfit recommendations, and Noir Closet personalization signals.'
}

export default function DashboardPage() {
  return <DashboardRoute />
}
