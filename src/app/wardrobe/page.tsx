import type { Metadata } from 'next'
import WardrobeRoute from './WardrobeRoute'

export const metadata: Metadata = {
  title: 'Wardrobe | FitFusion',
  description: 'Upload clothing, review AI-assisted tags, and manage your saved FitFusion wardrobe.'
}

export default function WardrobePage() {
  return <WardrobeRoute />
}
