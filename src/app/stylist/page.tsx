import type { Metadata } from 'next'
import StylistRoute from './StylistRoute'

export const metadata: Metadata = {
  title: 'AI Stylist | FitFusion',
  description: 'Chat with FitFusion for wardrobe-aware styling advice and outfit recommendations.'
}

export default function StylistPage() {
  return <StylistRoute />
}
