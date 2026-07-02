import type { Metadata } from 'next'
import ShoppingClient from './ShoppingClient'

export const metadata: Metadata = {
  title: 'AI Shopping Assistant',
  description: 'Optimize your Noir Closet wardrobe with AI gap analysis, impact scores, budget plans, and smart marketplace recommendations.'
}

export const dynamic = 'force-dynamic'

export default function ShoppingPage() {
  return <ShoppingClient />
}

