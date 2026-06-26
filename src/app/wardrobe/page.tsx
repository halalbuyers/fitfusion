import type { Metadata } from 'next'
import WardrobeRoute from './WardrobeRoute'

export const metadata: Metadata = {
  title: 'Wardrobe',
  description: 'Upload clothing, review AI-assisted tags, and manage your saved Noir Closet wardrobe.'
}

export default function WardrobePage() {
  return <WardrobeRoute />
}
