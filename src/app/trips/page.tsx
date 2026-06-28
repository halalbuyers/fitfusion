import type { Metadata } from 'next'
import TripsRoute from './TripsRoute'
import { JsonLd } from '../../components/JsonLd'
import { breadcrumbJsonLd, pageMetadata } from '../../lib/seo'

export const metadata: Metadata = pageMetadata('Trips', 'Plan travel packing lists and daily outfits from your Noir Closet wardrobe.', '/trips')

export default function TripsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Trips', path: '/trips' }])} />
      <TripsRoute />
    </>
  )
}

