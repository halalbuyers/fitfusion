import type { Metadata } from 'next'
import StylistRoute from './StylistRoute'

export const metadata: Metadata = {
  title: 'AI Stylist',
  description: 'Chat with Noir Closet for wardrobe-aware styling advice and outfit recommendations.'
}

export default function StylistPage() {
  return <StylistRoute />
}
