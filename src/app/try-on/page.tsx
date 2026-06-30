import type { Metadata } from 'next'
import TryOnRoute from './TryOnRoute'
import { JsonLd } from '../../components/JsonLd'
import { breadcrumbJsonLd, pageMetadata } from '../../lib/seo'

export const metadata: Metadata = pageMetadata('Virtual Try-On Studio', 'Preview Noir Closet outfits on your avatar with AI styling, comparisons, and editorial photoshoot controls.', '/try-on')

export default function TryOnPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Virtual Try-On Studio', path: '/try-on' }])} />
      <TryOnRoute />
    </>
  )
}
