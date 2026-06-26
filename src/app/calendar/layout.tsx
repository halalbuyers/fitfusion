import type { Metadata } from 'next'
import { JsonLd } from '../../components/JsonLd'
import { breadcrumbJsonLd, pageMetadata } from '../../lib/seo'

export const metadata: Metadata = pageMetadata('Calendar', 'Plan outfits with the Noir Closet fashion calendar and AI wardrobe intelligence.', '/calendar')

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Calendar', path: '/calendar' }])} />
      {children}
    </>
  )
}
