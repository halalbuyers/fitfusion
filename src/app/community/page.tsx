import type { Metadata } from 'next'
import CommunityRoute from './CommunityRoute'
import { JsonLd } from '../../components/JsonLd'
import { breadcrumbJsonLd, pageMetadata } from '../../lib/seo'

export const metadata: Metadata = pageMetadata('Community', 'Explore Noir Closet community outfit posts, styling inspiration, and creator fashion feeds.', '/community')

export default function CommunityPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Community', path: '/community' }])} />
      <CommunityRoute />
    </>
  )
}
