import type { Metadata } from 'next'
import HomeClient from './HomeClient'
import { JsonLd } from '../components/JsonLd'
import { SITE_NAME, SITE_TITLE, breadcrumbJsonLd, pageMetadata } from '../lib/seo'

export const metadata: Metadata = {
  ...pageMetadata('Noir Closet', undefined, '/'),
  title: { absolute: SITE_TITLE },
  openGraph: {
    title: SITE_NAME,
    description: 'AI Fashion Operating System',
    url: '/',
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: SITE_NAME }]
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: 'AI Fashion Operating System',
    images: ['/og-image.png']
  }
}

export default function Home() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }])} />
      <HomeClient />
    </>
  )
}
