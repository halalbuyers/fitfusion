import type { Metadata } from 'next'
import StylistRoute from './StylistRoute'
import { JsonLd } from '../../components/JsonLd'
import { breadcrumbJsonLd, pageMetadata } from '../../lib/seo'

export const metadata: Metadata = pageMetadata('AI Stylist', 'Chat with Noir Closet for wardrobe-aware styling advice and outfit recommendations.', '/stylist')

export default function StylistPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'AI Stylist', path: '/stylist' }])} />
      <StylistRoute />
    </>
  )
}
